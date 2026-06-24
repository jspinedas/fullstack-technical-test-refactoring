import { DatabaseAdapter } from './infrastructure/database/DatabaseAdapter';
import { DatabaseOrderRepository } from './infrastructure/repositories/DatabaseOrderRepository';
import { DatabaseUserRepository } from './infrastructure/repositories/DatabaseUserRepository';
import { StripePaymentProvider } from './infrastructure/providers/StripePaymentProvider';
import { TaxCalculator } from './application/services/TaxCalculator';
import { ProcessOrderUseCase } from './application/usecases/ProcessOrderUseCase';

// Composition root: wire all dependencies here, inject inward.
const db = new DatabaseAdapter();

const orderRepository = new DatabaseOrderRepository(db);
const userRepository = new DatabaseUserRepository(db);
const paymentProvider = new StripePaymentProvider();
const taxCalculator = new TaxCalculator();

export const processOrderUseCase = new ProcessOrderUseCase(
  userRepository,
  orderRepository,
  paymentProvider,
  taxCalculator,
);

export { ProcessOrderUseCase } from './application/usecases/ProcessOrderUseCase';
export type { ProcessOrderResult } from './application/usecases/ProcessOrderUseCase';
export { TaxCalculator } from './application/services/TaxCalculator';
export type { ITaxCalculator } from './domain/interfaces/ITaxCalculator';
export type { IPaymentProvider, ChargeRequest, ChargeResult } from './domain/interfaces/IPaymentProvider';
export type { IOrderRepository } from './domain/interfaces/IOrderRepository';
export type { IUserRepository } from './domain/interfaces/IUserRepository';
export type { User } from './domain/entities/User';
export type { Order, OrderStatus } from './domain/entities/Order';
export { UserNotFoundError } from './domain/errors/UserNotFoundError';
export { OrderNotFoundError } from './domain/errors/OrderNotFoundError';
