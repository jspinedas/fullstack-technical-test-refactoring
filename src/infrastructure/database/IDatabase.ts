export interface IDatabase {
  query<T>(sql: string, params?: unknown[]): Promise<T>;
}
