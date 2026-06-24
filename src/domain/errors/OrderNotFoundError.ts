export class OrderNotFoundError extends Error {
  constructor(orderId: string) {
    super(`Order not found: ${orderId}`);
    this.name = 'OrderNotFoundError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
