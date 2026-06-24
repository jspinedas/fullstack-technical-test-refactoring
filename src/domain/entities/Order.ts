export type OrderStatus = 'pending' | 'paid' | 'failed';

export interface Order {
  id: string;
  total: number;
  status: OrderStatus;
}
