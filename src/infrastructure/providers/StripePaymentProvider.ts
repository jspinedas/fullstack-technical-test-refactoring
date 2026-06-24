import axios from 'axios';
import { IPaymentProvider, ChargeRequest, ChargeResult } from '../../domain/interfaces/IPaymentProvider';

export class StripePaymentProvider implements IPaymentProvider {
  constructor(
    private readonly apiUrl: string = 'https://api.stripe.com/v1/charges',
  ) {}

  async charge(request: ChargeRequest): Promise<ChargeResult> {
    const response = await axios.post(this.apiUrl, {
      amount: request.amount,
      currency: request.currency,
      customer: request.customerId,
    });

    return { success: response.status === 200 };
  }
}
