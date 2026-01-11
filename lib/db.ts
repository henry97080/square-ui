import { sql } from "@vercel/postgres";

/**
 * Database query helper for Vercel Postgres
 * @param query SQL query string with $1, $2, etc. for parameters
 * @param params Array of parameters to bind to the query
 * @returns Query results with rows
 */
export async function query<T = any>(
  queryText: string,
  params: any[] = []
): Promise<{ rows: T[] }> {
  try {
    const result = await sql.query(queryText, params);
    return { rows: result.rows as T[] };
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Execute a command that doesn't return rows (INSERT, UPDATE, DELETE)
 * @param queryText SQL command string
 * @param params Array of parameters to bind to the command
 * @returns Result with rowCount
 */
export async function execute(
  queryText: string,
  params: any[] = []
): Promise<{ rowCount: number }> {
  try {
    const result = await sql.query(queryText, params);
    return { rowCount: result.rowCount ?? 0 };
  } catch (error) {
    console.error("Database execute error:", error);
    throw error;
  }
}
