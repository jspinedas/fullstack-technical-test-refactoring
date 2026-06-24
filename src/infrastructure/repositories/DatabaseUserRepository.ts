import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { User } from '../../domain/entities/User';
import { IDatabase } from '../database/IDatabase';

interface UserRow {
  id: string;
  country: string;
  stripeId: string;
}

export class DatabaseUserRepository implements IUserRepository {
  constructor(private readonly db: IDatabase) {}

  async findById(userId: string): Promise<User | null> {
    const row = await this.db.query<UserRow | null>(
      'SELECT id, country, stripeId FROM users WHERE id = ?',
      [userId],
    );
    return row ?? null;
  }
}
