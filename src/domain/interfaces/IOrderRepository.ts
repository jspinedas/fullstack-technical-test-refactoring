import { Order } from '../entities/Order';

export interface IOrderRepository {
  findById(orderId: string): Promise<Order | null>;
  markAsPaid(orderId: string, tax: number): Promise<void>;
}
