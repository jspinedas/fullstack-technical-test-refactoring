import { ITaxCalculator } from '../../domain/interfaces/ITaxCalculator';

const TAX_RATES: Readonly<Record<string, number>> = {
  ES: 0.21,
  US: 0.07,
};

export class TaxCalculator implements ITaxCalculator {
  calculate(country: string, orderTotal: number): number {
    const rate = TAX_RATES[country] ?? 0;
    return orderTotal * rate;
  }
}
