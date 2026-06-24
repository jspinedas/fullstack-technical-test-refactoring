import { ProcessOrderUseCase } from '../../src/application/usecases/ProcessOrderUseCase';
import { TaxCalculator } from '../../src/application/services/TaxCalculator';
import { IUserRepository } from '../../src/domain/interfaces/IUserRepository';
import { IOrderRepository } from '../../src/domain/interfaces/IOrderRepository';
import { IPaymentProvider } from '../../src/domain/interfaces/IPaymentProvider';
import { UserNotFoundError } from '../../src/domain/errors/UserNotFoundError';
import { OrderNotFoundError } from '../../src/domain/errors/OrderNotFoundError';
import { User } from '../../src/domain/entities/User';
import { Order } from '../../src/domain/entities/Order';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const SPANISH_USER: User = { id: 'user-es', country: 'ES', stripeId: 'cus_es_001' };
const US_USER: User     = { id: 'user-us', country: 'US', stripeId: 'cus_us_001' };
const NO_TAX_USER: User = { id: 'user-mx', country: 'MX', stripeId: 'cus_mx_001' };

const PENDING_ORDER: Order = { id: 'order-1', total: 100, status: 'pending' };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildMocks() {
  const userRepo  = { findById: jest.fn() } as jest.Mocked<IUserRepository>;
  const orderRepo = { findById: jest.fn(), markAsPaid: jest.fn() } as jest.Mocked<IOrderRepository>;
  const payment   = { charge: jest.fn() } as jest.Mocked<IPaymentProvider>;
  return { userRepo, orderRepo, payment };
}

// ─────────────────────────────────────────────────────────────────────────────

describe('ProcessOrderUseCase', () => {
  let userRepo:  jest.Mocked<IUserRepository>;
  let orderRepo: jest.Mocked<IOrderRepository>;
  let payment:   jest.Mocked<IPaymentProvider>;
  let useCase:   ProcessOrderUseCase;

  beforeEach(() => {
    ({ userRepo, orderRepo, payment } = buildMocks());
    useCase = new ProcessOrderUseCase(userRepo, orderRepo, payment, new TaxCalculator());
  });

  // ── 1. Validación de entidades ────────────────────────────────────────────

  describe('usuario inexistente', () => {
    it('lanza UserNotFoundError', async () => {
      userRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute('order-1', 'user-x'))
        .rejects.toThrow(UserNotFoundError);
    });

    it('no consulta la orden si el usuario no existe', async () => {
      userRepo.findById.mockResolvedValue(null);
      await useCase.execute('order-1', 'user-x').catch(() => {});

      expect(orderRepo.findById).not.toHaveBeenCalled();
    });
  });

  describe('orden inexistente', () => {
    it('lanza OrderNotFoundError', async () => {
      userRepo.findById.mockResolvedValue(SPANISH_USER);
      orderRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute('order-x', 'user-es'))
        .rejects.toThrow(OrderNotFoundError);
    });

    it('no intenta cobrar si la orden no existe', async () => {
      userRepo.findById.mockResolvedValue(SPANISH_USER);
      orderRepo.findById.mockResolvedValue(null);
      await useCase.execute('order-x', 'user-es').catch(() => {});

      expect(payment.charge).not.toHaveBeenCalled();
    });
  });

  // ── 2. Pago exitoso ───────────────────────────────────────────────────────

  describe('pago exitoso', () => {
    beforeEach(() => {
      userRepo.findById.mockResolvedValue(SPANISH_USER);
      orderRepo.findById.mockResolvedValue(PENDING_ORDER);
      payment.charge.mockResolvedValue({ success: true });
      orderRepo.markAsPaid.mockResolvedValue(undefined);
    });

    it('retorna { success: true }', async () => {
      const result = await useCase.execute('order-1', 'user-es');

      expect(result).toEqual({ success: true });
    });

    it('actualiza la orden con el tax correcto (ES 21% de 100 = 21)', async () => {
      await useCase.execute('order-1', 'user-es');

      expect(orderRepo.markAsPaid).toHaveBeenCalledTimes(1);
      expect(orderRepo.markAsPaid).toHaveBeenCalledWith('order-1', 21);
    });

    it('cobra el monto total incluyendo impuesto (100 + 21 = 121)', async () => {
      await useCase.execute('order-1', 'user-es');

      expect(payment.charge).toHaveBeenCalledWith(
        expect.objectContaining({ amount: 121 }),
      );
    });

    it('cobra usando el stripeId del usuario', async () => {
      await useCase.execute('order-1', 'user-es');

      expect(payment.charge).toHaveBeenCalledWith(
        expect.objectContaining({ customerId: SPANISH_USER.stripeId }),
      );
    });
  });

  // ── 3. Pago fallido ───────────────────────────────────────────────────────

  describe('pago fallido — proveedor retorna success: false', () => {
    beforeEach(() => {
      userRepo.findById.mockResolvedValue(SPANISH_USER);
      orderRepo.findById.mockResolvedValue(PENDING_ORDER);
      payment.charge.mockResolvedValue({ success: false });
    });

    it('retorna { success: false, error: "Payment failed" }', async () => {
      const result = await useCase.execute('order-1', 'user-es');

      expect(result).toEqual({ success: false, error: 'Payment failed' });
    });

    it('no actualiza la orden cuando el pago falla', async () => {
      await useCase.execute('order-1', 'user-es');

      expect(orderRepo.markAsPaid).not.toHaveBeenCalled();
    });
  });

  describe('pago fallido — proveedor lanza excepción', () => {
    beforeEach(() => {
      userRepo.findById.mockResolvedValue(SPANISH_USER);
      orderRepo.findById.mockResolvedValue(PENDING_ORDER);
      payment.charge.mockRejectedValue(new Error('Network timeout'));
    });

    it('retorna { success: false, error: "Payment failed" }', async () => {
      const result = await useCase.execute('order-1', 'user-es');

      expect(result).toEqual({ success: false, error: 'Payment failed' });
    });

    it('no actualiza la orden cuando el proveedor lanza excepción', async () => {
      await useCase.execute('order-1', 'user-es');

      expect(orderRepo.markAsPaid).not.toHaveBeenCalled();
    });
  });

  // ── 4. Error post-pago (BD falla después de cobrar) ───────────────────────

  describe('error en persistencia tras pago exitoso', () => {
    it('propaga el error de BD para que el caller pueda reintentar sin volver a cobrar', async () => {
      userRepo.findById.mockResolvedValue(SPANISH_USER);
      orderRepo.findById.mockResolvedValue(PENDING_ORDER);
      payment.charge.mockResolvedValue({ success: true });
      orderRepo.markAsPaid.mockRejectedValue(new Error('DB connection lost'));

      await expect(useCase.execute('order-1', 'user-es'))
        .rejects.toThrow('DB connection lost');
    });
  });

  // ── 5. Cálculo de impuesto por país ──────────────────────────────────────

  describe('cálculo del monto cobrado según el país del usuario', () => {
    it.each([
      { user: SPANISH_USER,  total: 100, expectedCharge: 121, label: 'ES 21%' },
      { user: US_USER,       total: 200, expectedCharge: 214, label: 'US 7%'  },
      { user: NO_TAX_USER,   total: 150, expectedCharge: 150, label: 'MX 0%'  },
    ])('$label: total $total → cargo $expectedCharge', async ({ user, total, expectedCharge }) => {
      userRepo.findById.mockResolvedValue(user);
      orderRepo.findById.mockResolvedValue({ ...PENDING_ORDER, total });
      payment.charge.mockResolvedValue({ success: true });
      orderRepo.markAsPaid.mockResolvedValue(undefined);

      await useCase.execute('order-1', user.id);

      expect(payment.charge).toHaveBeenCalledWith(
        expect.objectContaining({ amount: expectedCharge }),
      );
    });
  });
});
