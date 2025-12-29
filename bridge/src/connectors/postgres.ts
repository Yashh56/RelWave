// bridge/src/connectors/postgres.ts
import { Client } from "pg";
import QueryStream from "pg-query-stream";
import { Readable } from "stream";

export type PGConfig = {
  host: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
  sslmode?: string;
};

// ============================================
// CACHING SYSTEM FOR POSTGRES CONNECTOR
// ============================================

// Cache configuration
const CACHE_TTL = 60000; // 1 minute default TTL
const STATS_CACHE_TTL = 30000; // 30 seconds for stats (changes more frequently)
const SCHEMA_CACHE_TTL = 300000; // 5 minutes for schemas (rarely change)

/**
 * Generic cache entry with TTL support
 */
type CacheEntry<T> = {
  data: T;
  timestamp: number;
  ttl: number;
};

/**
 * Type definitions for cached data
 */
type TableInfo = {
  schema: string;
  name: string;
  type: string;
};

type PrimaryKeyInfo = {
  column_name: string;
};

type DBStats = {
  total_tables: number;
  total_db_size_mb: number;
  total_rows: number;
};

type SchemaInfo = {
  name: string;
};

type ColumnDetail = {
  name: string;
  type: string;
  not_nullable: boolean;
  default_value: string | null;
  is_primary_key: boolean;
  is_foreign_key: boolean;
};

/**
 * PostgreSQL Cache Manager - handles all caching for Postgres connector
 */
export class PostgresCacheManager {
  // Cache stores for different data types
  private tableListCache = new Map<string, CacheEntry<TableInfo[]>>();
  private primaryKeysCache = new Map<string, CacheEntry<PrimaryKeyInfo[]>>();
  private dbStatsCache = new Map<string, CacheEntry<DBStats>>();
  private schemasCache = new Map<string, CacheEntry<SchemaInfo[]>>();
  private tableDetailsCache = new Map<string, CacheEntry<ColumnDetail[]>>();

  /**
   * Generate cache key from config
   */
  private getConfigKey(cfg: PGConfig): string {
    return `${cfg.host}:${cfg.port || 5432}:${cfg.database || ""}`;
  }

  /**
   * Generate cache key for table-specific data
   */
  private getTableKey(cfg: PGConfig, schema: string, table: string): string {
    return `${this.getConfigKey(cfg)}:${schema}:${table}`;
  }

  /**
   * Generate cache key for schema-specific data
   */
  private getSchemaKey(cfg: PGConfig, schema: string): string {
    return `${this.getConfigKey(cfg)}:${schema}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isValid<T>(entry: CacheEntry<T> | undefined): boolean {
    if (!entry) return false;
    return Date.now() - entry.timestamp < entry.ttl;
  }

  // ============ TABLE LIST CACHE ============
  getTableList(cfg: PGConfig, schema?: string): TableInfo[] | null {
    const key = schema ? this.getSchemaKey(cfg, schema) : this.getConfigKey(cfg);
    const entry = this.tableListCache.get(key);
    if (this.isValid(entry)) {
      console.log(`[Postgres Cache] HIT: tableList for ${key}`);
      return entry!.data;
    }
    return null;
  }

  setTableList(cfg: PGConfig, data: TableInfo[], schema?: string): void {
    const key = schema ? this.getSchemaKey(cfg, schema) : this.getConfigKey(cfg);
    this.tableListCache.set(key, { data, timestamp: Date.now(), ttl: CACHE_TTL });
    console.log(`[Postgres Cache] SET: tableList for ${key}`);
  }

  // ============ PRIMARY KEYS CACHE ============
  getPrimaryKeys(cfg: PGConfig, schema: string, table: string): PrimaryKeyInfo[] | null {
    const key = this.getTableKey(cfg, schema, table);
    const entry = this.primaryKeysCache.get(key);
    if (this.isValid(entry)) {
      console.log(`[Postgres Cache] HIT: primaryKeys for ${key}`);
      return entry!.data;
    }
    return null;
  }

  setPrimaryKeys(cfg: PGConfig, schema: string, table: string, data: PrimaryKeyInfo[]): void {
    const key = this.getTableKey(cfg, schema, table);
    this.primaryKeysCache.set(key, { data, timestamp: Date.now(), ttl: CACHE_TTL });
    console.log(`[Postgres Cache] SET: primaryKeys for ${key}`);
  }

  // ============ DB STATS CACHE ============
  getDBStats(cfg: PGConfig): DBStats | null {
    const key = this.getConfigKey(cfg);
    const entry = this.dbStatsCache.get(key);
    if (this.isValid(entry)) {
      console.log(`[Postgres Cache] HIT: dbStats for ${key}`);
      return entry!.data;
    }
    return null;
  }

  setDBStats(cfg: PGConfig, data: DBStats): void {
    const key = this.getConfigKey(cfg);
    this.dbStatsCache.set(key, { data, timestamp: Date.now(), ttl: STATS_CACHE_TTL });
    console.log(`[Postgres Cache] SET: dbStats for ${key}`);
  }

  // ============ SCHEMAS CACHE ============
  getSchemas(cfg: PGConfig): SchemaInfo[] | null {
    const key = this.getConfigKey(cfg);
    const entry = this.schemasCache.get(key);
    if (this.isValid(entry)) {
      console.log(`[Postgres Cache] HIT: schemas for ${key}`);
      return entry!.data;
    }
    return null;
  }

  setSchemas(cfg: PGConfig, data: SchemaInfo[]): void {
    const key = this.getConfigKey(cfg);
    this.schemasCache.set(key, { data, timestamp: Date.now(), ttl: SCHEMA_CACHE_TTL });
    console.log(`[Postgres Cache] SET: schemas for ${key}`);
  }

  // ============ TABLE DETAILS CACHE ============
  getTableDetails(cfg: PGConfig, schema: string, table: string): ColumnDetail[] | null {
    const key = this.getTableKey(cfg, schema, table);
    const entry = this.tableDetailsCache.get(key);
    if (this.isValid(entry)) {
      console.log(`[Postgres Cache] HIT: tableDetails for ${key}`);
      return entry!.data;
    }
    return null;
  }

  setTableDetails(cfg: PGConfig, schema: string, table: string, data: ColumnDetail[]): void {
    const key = this.getTableKey(cfg, schema, table);
    this.tableDetailsCache.set(key, { data, timestamp: Date.now(), ttl: CACHE_TTL });
    console.log(`[Postgres Cache] SET: tableDetails for ${key}`);
  }

  // ============ CACHE MANAGEMENT ============
  
  /**
   * Clear all caches for a specific database connection
   */
  clearForConnection(cfg: PGConfig): void {
    const configKey = this.getConfigKey(cfg);
    
    // Clear all entries that start with this config key
    for (const [key] of this.tableListCache) {
      if (key.startsWith(configKey)) this.tableListCache.delete(key);
    }
    for (const [key] of this.primaryKeysCache) {
      if (key.startsWith(configKey)) this.primaryKeysCache.delete(key);
    }
    for (const [key] of this.tableDetailsCache) {
      if (key.startsWith(configKey)) this.tableDetailsCache.delete(key);
    }
    
    this.dbStatsCache.delete(configKey);
    this.schemasCache.delete(configKey);
    
    console.log(`[Postgres Cache] Cleared all caches for ${configKey}`);
  }

  /**
   * Clear table-specific cache (useful after DDL operations)
   */
  clearTableCache(cfg: PGConfig, schema: string, table: string): void {
    const key = this.getTableKey(cfg, schema, table);
    this.primaryKeysCache.delete(key);
    this.tableDetailsCache.delete(key);
    console.log(`[Postgres Cache] Cleared table cache for ${key}`);
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.tableListCache.clear();
    this.primaryKeysCache.clear();
    this.dbStatsCache.clear();
    this.schemasCache.clear();
    this.tableDetailsCache.clear();
    console.log(`[Postgres Cache] Cleared all caches`);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    tableLists: number;
    primaryKeys: number;
    dbStats: number;
    schemas: number;
    tableDetails: number;
  } {
    return {
      tableLists: this.tableListCache.size,
      primaryKeys: this.primaryKeysCache.size,
      dbStats: this.dbStatsCache.size,
      schemas: this.schemasCache.size,
      tableDetails: this.tableDetailsCache.size,
    };
  }
}

// Singleton cache manager instance
export const postgresCache = new PostgresCacheManager();

/**
 * Creates a new Client instance from the config.
 * Encapsulates the configuration mapping logic.
 */
function createClient(cfg: PGConfig): Client {
  return new Client({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    ssl: cfg.ssl || undefined,
    password: cfg.password || undefined,
    database: cfg.database || undefined,
  });
}

/** test connection quickly */
export async function testConnection(cfg: PGConfig): Promise<{ ok: boolean; message?: string; status: 'connected' | 'disconnected' }> {
  const client = createClient(cfg);
  try {
    await client.connect();
    await client.end();
    return { ok: true, status: 'connected', message: "Connection successful" };
  } catch (err: any) {
    return { ok: false, message: err.message || String(err), status: 'disconnected' };
  }
}

/**
 * Request pg_cancel_backend on target PID using a fresh connection.
 * Returns true if successful (pg_cancel_backend returns boolean).
 */
export async function pgCancel(cfg: PGConfig, targetPid: number) {
  const c = createClient(cfg);
  try {
    await c.connect();
    const res = await c.query("SELECT pg_cancel_backend($1) AS cancelled", [
      targetPid,
    ]);
    await c.end();
    return res.rows?.[0]?.cancelled === true;
  } catch (err) {
    try {
      await c.end();
    } catch (e) { }
    throw err;
  }
}

/**
 * Executes a simple SELECT * query to fetch all data from a single table.
 * @param config - The PostgreSQL connection configuration.
 * @param schemaName - The schema the table belongs to (e.g., 'public').
 * @param tableName - The name of the table to query.
 * @returns A Promise resolving to the query result rows (Array<any>).
 */
export async function fetchTableData(
  config: PGConfig,
  schemaName: string,
  tableName: string,
  limit: number,
  page: number
): Promise<{ rows: any[]; total: number }> {

  const client = createClient(config);

  try {
    await client.connect();

    const safeSchema = `"${schemaName.replace(/"/g, '""')}"`;
    const safeTable = `"${tableName.replace(/"/g, '""')}"`;

    const offset = (page - 1) * limit;

    const pkResult = await listPrimaryKeys(config, schemaName, tableName);
    const pkColumns = pkResult.map((r: any) =>
      `"${r.column_name.replace(/"/g, '""')}"`
    );

    let orderBy = "";

    if (pkColumns.length > 0) {
      orderBy = `ORDER BY ${pkColumns.join(", ")}`;
    } else {
      const colQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position;
      `;

      const colResult = await client.query(colQuery, [schemaName, tableName]);
      const columns = colResult.rows.map((r) => `"${r.column_name}"`);

      orderBy = columns.length > 0 ? `ORDER BY ${columns.join(", ")}` : "";
    }

    const countQuery = `
      SELECT COUNT(*) AS count
      FROM ${safeSchema}.${safeTable};
    `;
    const totalResult = await client.query(countQuery);
    const total = Number(totalResult.rows[0].count);

    const dataQuery = `
      SELECT *
      FROM ${safeSchema}.${safeTable}
      ${orderBy}
      LIMIT $1 OFFSET $2;
    `;

    const result = await client.query(dataQuery, [limit, offset]);

    return { rows: result.rows, total };
  } catch (error) {
    throw new Error(
      `Failed to fetch paginated data from ${schemaName}.${tableName}: ${error}`
    );
  } finally {
    try {
      await client.end();
    } catch (_) { }
  }
}


/**
 * listTables: Retrieves all user-defined tables and views.
 */

export async function listTables(connection: PGConfig, schemaName?: string) {
  // Check cache first
  const cached = postgresCache.getTableList(connection, schemaName);
  if (cached !== null) {
    return cached;
  }

  const client = createClient(connection);

  let query = `
    SELECT table_schema AS schema, table_name AS name, table_type AS type
    FROM information_schema.tables
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      AND table_type = 'BASE TABLE'
  `;
  let queryParams: string[] = [];

  // Add schema filter if provided
  if (schemaName) {
    query += ` AND table_schema = $1`;
    queryParams.push(schemaName);
  }

  query += ` ORDER BY table_schema, table_name;`;

  try {
    await client.connect();

    // Execute the dynamically constructed query
    const res = await client.query(query, queryParams);

    await client.end();

    const result = res.rows;

    // Cache the result
    postgresCache.setTableList(connection, result, schemaName);

    return result; // [{schema, name, type}, ...]
  } catch (err) {
    try {
      await client.end();
    } catch (e) { }
    throw err;
  }
}

export async function listPrimaryKeys(connection: PGConfig, schemaName: string = 'public', tableName: string) {
  // Check cache first
  const cached = postgresCache.getPrimaryKeys(connection, schemaName, tableName);
  if (cached !== null) {
    return cached;
  }

  const client = createClient(connection);

  const query = `
   SELECT 
    a.attname AS column_name
FROM 
    pg_index i
JOIN 
    pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
WHERE 
    i.indrelid = $1::regclass
AND 
    i.indisprimary
  `;

  try {
    await client.connect();
    const res = await client.query(query, [tableName]);
    
    const result = res.rows;
    
    // Cache the result
    postgresCache.setPrimaryKeys(connection, schemaName, tableName, result);
    
    return result;
  } catch (err) {
    try {
      await client.end();
    } catch (e) { }
    throw err;
  }
}

/**
 * streamQueryCancelable:
 * - uses pg-query-stream to stream results
 * - buffers rows up to batchSize, then calls onBatch(rows, columns)
 * - returns { promise, cancel } where cancel tries pg_cancel_backend(pid) then destroys stream
 */
export function streamQueryCancelable(
  cfg: PGConfig,
  sql: string,
  batchSize: number,
  onBatch: (rows: any[], columns: { name: string }[]) => Promise<void> | void,
  onDone?: () => void
): { promise: Promise<void>; cancel: () => Promise<void> } {
  const client = createClient(cfg);
  let stream: Readable | null = null;
  let finished = false;
  let cancelled = false;
  let backendPid: number | null = null;

  const promise = (async () => {
    await client.connect();

    // capture backend pid (node-postgres exposes processID)
    // @ts-ignore
    backendPid = (client as any).processID ?? null;

    const qs = new QueryStream(sql, [], { batchSize });
    // @ts-ignore - pg typings may not allow QueryStream here directly
    stream = (client.query as any)(qs) as Readable;

    let columns: { name: string }[] | null = null;
    let buffer: any[] = [];

    // helper to flush buffer
    const flush = async () => {
      if (buffer.length === 0) return;
      const rows = buffer.splice(0, buffer.length);
      await onBatch(rows, columns || []);
    };

    try {
      return await new Promise<void>((resolve, reject) => {
        stream!.on("data", (row: any) => {
          // collect columns lazily
          if (columns === null) {
            columns = Object.keys(row).map((k) => ({ name: k }));
          }
          buffer.push(row);
          if (buffer.length >= batchSize) {
            // flush asynchronously, but capture errors
            flush().catch((e) => {
              try {
                reject(e);
              } catch { }
            });
          }
        });

        stream!.on("end", async () => {
          try {
            await flush();
            finished = true;
            if (onDone) onDone();
            resolve();
          } catch (e) {
            reject(e);
          }
        });

        stream!.on("error", (err) => {
          reject(err);
        });
      });
    } finally {
      // ensure cleanup
      try {
        if (!finished) {
          // nothing special here
        }
      } finally {
        try {
          await client.end();
        } catch (e) { }
      }
    }
  })();

  // cancel function: try pg_cancel_backend first (if we have pid), then destroy stream and end client
  async function cancel() {
    if (finished || cancelled) return;
    cancelled = true;

    // 1) Attempt server-side cancel if we have the backend PID and cfg present
    if (backendPid && typeof backendPid === "number") {
      try {
        await pgCancel(cfg, backendPid);
        // After asking the server to cancel, still destroy local stream for immediate stop
      } catch (e) {
        // best-effort, ignore errors from pgCancel
      }
    }

    // 2) Destroy stream locally to stop 'data' events and let promise reject/resolve
    try {
      if (stream && typeof (stream as any).destroy === "function") {
        (stream as any).destroy(new Error("cancelled"));
      }
    } catch (e) {
      /* ignore */
    }

    // 3) Close client connection
    try {
      await client.end();
    } catch (e) {
      /* ignore */
    }
  }

  return { promise, cancel };
}

export async function getDBStats(connection: PGConfig): Promise<{
  total_tables: number;
  total_db_size_mb: number;
  total_rows: number;
}> {
  // Check cache first
  const cached = postgresCache.getDBStats(connection);
  if (cached !== null) {
    return cached;
  }

  const client = createClient(connection);
  try {
    await client.connect();
    const res = await client.query(`
      SELECT
        (SELECT COUNT(*) 
         FROM information_schema.tables
         WHERE table_schema = current_schema() AND table_type = 'BASE TABLE') AS total_tables,
        (SELECT COALESCE(SUM(n_live_tup), 0)
         FROM pg_stat_user_tables 
         WHERE schemaname = current_schema()) AS total_rows, -- <-- NEW: Aggregated row count
        (pg_database_size(current_database()) / (1024.0 * 1024.0)) AS total_db_size_mb;
    `);

    // CRITICAL: Ensure the pg client is closed after a successful query
    await client.end();

    // CRITICAL: Update the return type structure
    const result = res.rows?.[0] as {
      total_tables: number;
      total_db_size_mb: number;
      total_rows: number;
    };

    // Cache the result
    postgresCache.setDBStats(connection, result);

    return result;
  } catch (error) {
    // 5. CRITICAL: Handle the error (log it and re-throw it or return null/undefined)
    console.error("Error fetching database stats:", error);
    // Attempt to close the client even if an error occurred during connection/query
    try {
      await client.end();
    } catch (endError) {
      console.error("Error closing client after failure:", endError);
    }
    // Re-throw the error so the calling function knows something went wrong
    throw error;
  }
}
/**
 * Retrieves list of schemas in the database.
 */
export async function listSchemas(connection: PGConfig) {
  // Check cache first
  const cached = postgresCache.getSchemas(connection);
  if (cached !== null) {
    return cached;
  }

  const client = createClient(connection);
  try {
    await client.connect();
    const res = await client.query(
      `SELECT nspname AS name
             FROM pg_namespace
             WHERE nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
             AND nspname NOT LIKE 'pg_temp_%' AND nspname NOT LIKE 'pg_toast_temp_%'
             ORDER BY nspname;`
    );
    await client.end();

    const result = res.rows;

    // Cache the result
    postgresCache.setSchemas(connection, result);

    return result; // [{ name: 'public' }, { name: 'analytics' }, ...]
  } catch (err) {
    try {
      await client.end();
    } catch (e) { }
    throw err;
  }
}

/** getTableDetails: Retrieves column details for a specific table. */
export async function getTableDetails(
  connection: PGConfig,
  schemaName: string,
  tableName: string
) {
  // Check cache first
  const cached = postgresCache.getTableDetails(connection, schemaName, tableName);
  if (cached !== null) {
    return cached;
  }

  const client = createClient(connection);
  try {
    await client.connect();
    const res = await client.query(
      `SELECT
                a.attname AS name,
                format_type(a.atttypid, a.atttypmod) AS type,
                a.attnotnull AS not_nullable,
                pg_get_expr(d.adbin, d.adrelid) AS default_value,
                (SELECT TRUE FROM pg_constraint pc WHERE pc.conrelid = a.attrelid AND a.attnum = ANY(pc.conkey) AND pc.contype = 'p') AS is_primary_key,
                (SELECT TRUE FROM pg_constraint fc WHERE fc.conrelid = a.attrelid AND a.attnum = ANY(fc.conkey) AND fc.contype = 'f') AS is_foreign_key
             FROM 
                pg_attribute a
             LEFT JOIN 
                pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
             WHERE 
                a.attrelid = $1::regclass -- Use $1::regclass for direct comparison against OID/regclass
                AND a.attnum > 0
                AND NOT a.attisdropped
             ORDER BY a.attnum;`,
      [`${schemaName}.${tableName}`]
    );
    await client.end();

    const result = res.rows;

    // Cache the result
    postgresCache.setTableDetails(connection, schemaName, tableName, result);

    return result;
  } catch (err) {
    // ... (Error handling)
    throw err;
  }
}
