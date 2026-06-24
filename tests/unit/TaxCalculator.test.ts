import { TaxCalculator } from '../../src/application/services/TaxCalculator';

describe('TaxCalculator', () => {
  let calculator: TaxCalculator;

  beforeEach(() => {
    calculator = new TaxCalculator();
  });

  describe('España (ES) — 21%', () => {
    it('aplica 21% sobre el total', () => {
      expect(calculator.calculate('ES', 100)).toBe(21);
    });

    it('calcula correctamente con totales decimales', () => {
      expect(calculator.calculate('ES', 50)).toBe(10.5);
    });
  });

  describe('Estados Unidos (US) — 7%', () => {
    // 0.07 is not exactly representable in IEEE 754; toBeCloseTo handles the epsilon.
    it('aplica 7% sobre el total', () => {
      expect(calculator.calculate('US', 100)).toBeCloseTo(7, 10);
    });

    it('calcula correctamente con totales decimales', () => {
      expect(calculator.calculate('US', 200)).toBeCloseTo(14, 10);
    });
  });

  describe('País sin configuración — 0%', () => {
    it('retorna 0 para un país no configurado (MX)', () => {
      expect(calculator.calculate('MX', 100)).toBe(0);
    });

    it('retorna 0 para cualquier otro país no configurado (AR)', () => {
      expect(calculator.calculate('AR', 100)).toBe(0);
    });

    it('retorna 0 para código de país vacío', () => {
      expect(calculator.calculate('', 100)).toBe(0);
    });
  });

  describe('casos borde', () => {
    it('retorna 0 cuando el total de la orden es 0', () => {
      expect(calculator.calculate('ES', 0)).toBe(0);
      expect(calculator.calculate('US', 0)).toBe(0);
    });
  });
});
