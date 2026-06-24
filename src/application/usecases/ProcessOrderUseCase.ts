import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IOrderRepository } from '../../domain/interfaces/IOrderRepository';
import { IPaymentProvider } from '../../domain/interfaces/IPaymentProvider';
import { ITaxCalculator } from '../../domain/interfaces/ITaxCalculator';
import { UserNotFoundError } from '../../domain/errors/UserNotFoundError';
import { OrderNotFoundError } from '../../domain/errors/OrderNotFoundError';

export interface ProcessOrderResult {
  success: boolean;
  error?: string;
}

export class ProcessOrderUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly orderRepository: IOrderRepository,
    private readonly paymentProvider: IPaymentProvider,
    private readonly taxCalculator: ITaxCalculator,
  ) {}

  async execute(orderId: string, userId: string): Promise<ProcessOrderResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const order = await this.orderRepository.findById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);

    const tax = this.taxCalculator.calculate(user.country, order.total);
    const finalTotal = order.total + tax;

    // TODO: currency should come from Order or be derived from user.country (multi-currency support).
    // Preserved as 'usd' for behavioral equivalence with the legacy implementation.
    let chargeSucceeded = false;
    try {
      const result = await this.paymentProvider.charge({
        amount: finalTotal,
        currency: 'usd',
        customerId: user.stripeId,
      });
      chargeSucceeded = result.success;
    } catch {
      return { success: false, error: 'Payment failed' };
    }

    if (!chargeSucceeded) {
      return { success: false, error: 'Payment failed' };
    }

    // markAsPaid is intentionally outside the payment try-catch: if the DB update
    // fails after a successful charge, the error must propagate so the caller can
    // retry the update without re-charging the customer.
    await this.orderRepository.markAsPaid(orderId, tax);
    return { success: true };
  }
}
