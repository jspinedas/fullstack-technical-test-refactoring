import db from '../../../legacy/database';
import { IDatabase } from './IDatabase';

// Single boundary point between the legacy db module and the typed IDatabase interface.
// The cast on the query result is intentional and isolated here; all callers receive
// strongly-typed results through their own row interfaces.
export class DatabaseAdapter implements IDatabase {
  async query<T>(sql: string, params: unknown[] = []): Promise<T> {
    const result: unknown = await db.query(sql, params);
    return result as T;
  }
}
