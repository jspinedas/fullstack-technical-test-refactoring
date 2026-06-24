export interface ChargeRequest {
  amount: number;
  currency: string;
  customerId: string;
}

export interface ChargeResult {
  success: boolean;
}

export interface IPaymentProvider {
  charge(request: ChargeRequest): Promise<ChargeResult>;
}
