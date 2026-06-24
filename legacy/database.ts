// Stub for the legacy database module.
// Replace this with the real database connection in production.
interface LegacyDatabase {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T>;
}

const db: LegacyDatabase = {
  query: async <T>(_sql: string, _params?: unknown[]): Promise<T> => {
    throw new Error('Database not configured. Provide a real database connection.');
  },
};

export default db;
