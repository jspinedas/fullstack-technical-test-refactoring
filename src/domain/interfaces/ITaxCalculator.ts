export interface ITaxCalculator {
  calculate(country: string, orderTotal: number): number;
}
