import { IOrderRepository } from '../../domain/interfaces/IOrderRepository';
import { Order, OrderStatus } from '../../domain/entities/Order';
import { IDatabase } from '../database/IDatabase';

interface OrderRow {
  id: string;
  total: number;
  status: OrderStatus;
}

export class DatabaseOrderRepository implements IOrderRepository {
  constructor(private readonly db: IDatabase) {}

  async findById(orderId: string): Promise<Order | null> {
    const row = await this.db.query<OrderRow | null>(
      'SELECT id, total, status FROM orders WHERE id = ?',
      [orderId],
    );
    return row ?? null;
  }

  async markAsPaid(orderId: string, tax: number): Promise<void> {
    await this.db.query(
      'UPDATE orders SET status = ?, tax = ? WHERE id = ?',
      ['paid', tax, orderId],
    );
  }
}
