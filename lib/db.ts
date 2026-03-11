import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

const queryClient = postgres(connectionString);

export const db = drizzle(queryClient, { schema });

/**
 * Execute a function within a tenant-isolated transaction.
 * Sets PostgreSQL session variable for Row-Level Security.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (tx: typeof db) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      `SET LOCAL app.current_tenant = '${tenantId}'`
    );
    return fn(tx as unknown as typeof db);
  });
}
