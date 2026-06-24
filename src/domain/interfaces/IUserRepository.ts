import { User } from '../entities/User';

export interface IUserRepository {
  findById(userId: string): Promise<User | null>;
}
