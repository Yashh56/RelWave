import mysql, {
  FieldPacket,
  PoolOptions,
  RowDataPacket,
  PoolConnection,
} from "mysql2/promise";

export type MySQLConfig = {
  host: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
};

// ============================================
// CACHING SYSTEM FOR MYSQL CONNECTOR
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
 * MySQL Cache Manager - handles all caching for MySQL connector
 */
class MySQLCacheManager {
  // Cache stores for different data types
  private tableListCache = new Map<string, CacheEntry<TableInfo[]>>();
  private columnsCache = new Map<string, CacheEntry<RowDataPacket[]>>();
  private primaryKeysCache = new Map<string, CacheEntry<string[]>>();
  private dbStatsCache = new Map<string, CacheEntry<DBStats>>();
  private schemasCache = new Map<string, CacheEntry<{ name: string }[]>>();
  private tableDetailsCache = new Map<string, CacheEntry<ColumnDetail[]>>();

  /**
   * Generate cache key from config
   */
  private getConfigKey(cfg: MySQLConfig): string {
    return `${cfg.host}:${cfg.port || 3306}:${cfg.database || ""}`;
  }

  /**
   * Generate cache key for table-specific data
   */
  private getTableKey(cfg: MySQLConfig, schema: string, table: string): string {
    return `${this.getConfigKey(cfg)}:${schema}:${table}`;
  }

  /**
   * Generate cache key for schema-specific data
   */
  private getSchemaKey(cfg: MySQLConfig, schema: string): string {
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
  getTableList(cfg: MySQLConfig, schema?: string): TableInfo[] | null {
    const key = schema ? this.getSchemaKey(cfg, schema) : this.getConfigKey(cfg);
    const entry = this.tableListCache.get(key);
    if (this.isValid(entry)) {
      console.log(`[MySQL Cache] HIT: tableList for ${key}`);
      return entry!.data;
    }
    return null;
  }

  setTableList(cfg: MySQLConfig, data: TableInfo[], schema?: string): void {
    const key = schema ? this.getSchemaKey(cfg, schema) : this.getConfigKey(cfg);
    this.tableListCache.set(key, { data, timestamp: Date.now(), ttl: CACHE_TTL });
    console.log(`[MySQL Cache] SET: tableList for ${key}`);
  }

  // ============ COLUMNS CACHE ============
  getColumns(cfg: MySQLConfig, schema: string, table: string): RowDataPacket[] | null {
    const key = this.getTableKey(cfg, schema, table);
    const entry = this.columnsCache.get(key);
    if (this.isValid(entry)) {
      console.log(`[MySQL Cache] HIT: columns for ${key}`);
      return entry!.data;
    }
    return null;
  }

  setColumns(cfg: MySQLConfig, schema: string, table: string, data: RowDataPacket[]): void {
    const key = this.getTableKey(cfg, schema, table);
    this.columnsCache.set(key, { data, timestamp: Date.now(), ttl: CACHE_TTL });
    console.log(`[MySQL Cache] SET: columns for ${key}`);
  }

  // ============ PRIMARY KEYS CACHE ============
  getPrimaryKeys(cfg: MySQLConfig, schema: string, table: string): string[] | null {
    const key = this.getTableKey(cfg, schema, table);
    const entry = this.primaryKeysCache.get(key);
    if (this.isValid(entry)) {
      console.log(`[MySQL Cache] HIT: primaryKeys for ${key}`);
      return entry!.data;
    }
    return null;
  }

  setPrimaryKeys(cfg: MySQLConfig, schema: string, table: string, data: string[]): void {
    const key = this.getTableKey(cfg, schema, table);
    this.primaryKeysCache.set(key, { data, timestamp: Date.now(), ttl: CACHE_TTL });
    console.log(`[MySQL Cache] SET: primaryKeys for ${key}`);
  }

  // ============ DB STATS CACHE ============
  getDBStats(cfg: MySQLConfig): DBStats | null {
    const key = this.getConfigKey(cfg);
    const entry = this.dbStatsCache.get(key);
    if (this.isValid(entry)) {
      console.log(`[MySQL Cache] HIT: dbStats for ${key}`);
      return entry!.data;
    }
    return null;
  }

  setDBStats(cfg: MySQLConfig, data: DBStats): void {
    const key = this.getConfigKey(cfg);
    this.dbStatsCache.set(key, { data, timestamp: Date.now(), ttl: STATS_CACHE_TTL });
    console.log(`[MySQL Cache] SET: dbStats for ${key}`);
  }

  // ============ SCHEMAS CACHE ============
  getSchemas(cfg: MySQLConfig): { name: string }[] | null {
    const key = this.getConfigKey(cfg);
    const entry = this.schemasCache.get(key);
    if (this.isValid(entry)) {
      console.log(`[MySQL Cache] HIT: schemas for ${key}`);
      return entry!.data;
    }
    return null;
  }

  setSchemas(cfg: MySQLConfig, data: { name: string }[]): void {
    const key = this.getConfigKey(cfg);
    this.schemasCache.set(key, { data, timestamp: Date.now(), ttl: SCHEMA_CACHE_TTL });
    console.log(`[MySQL Cache] SET: schemas for ${key}`);
  }

  // ============ TABLE DETAILS CACHE ============
  getTableDetails(cfg: MySQLConfig, schema: string, table: string): ColumnDetail[] | null {
    const key = this.getTableKey(cfg, schema, table);
    const entry = this.tableDetailsCache.get(key);
    if (this.isValid(entry)) {
      console.log(`[MySQL Cache] HIT: tableDetails for ${key}`);
      return entry!.data;
    }
    return null;
  }

  setTableDetails(cfg: MySQLConfig, schema: string, table: string, data: ColumnDetail[]): void {
    const key = this.getTableKey(cfg, schema, table);
    this.tableDetailsCache.set(key, { data, timestamp: Date.now(), ttl: CACHE_TTL });
    console.log(`[MySQL Cache] SET: tableDetails for ${key}`);
  }

  // ============ CACHE MANAGEMENT ============
  
  /**
   * Clear all caches for a specific database connection
   */
  clearForConnection(cfg: MySQLConfig): void {
    const configKey = this.getConfigKey(cfg);
    
    // Clear all entries that start with this config key
    for (const [key] of this.tableListCache) {
      if (key.startsWith(configKey)) this.tableListCache.delete(key);
    }
    for (const [key] of this.columnsCache) {
      if (key.startsWith(configKey)) this.columnsCache.delete(key);
    }
    for (const [key] of this.primaryKeysCache) {
      if (key.startsWith(configKey)) this.primaryKeysCache.delete(key);
    }
    for (const [key] of this.tableDetailsCache) {
      if (key.startsWith(configKey)) this.tableDetailsCache.delete(key);
    }
    
    this.dbStatsCache.delete(configKey);
    this.schemasCache.delete(configKey);
    
    console.log(`[MySQL Cache] Cleared all caches for ${configKey}`);
  }

  /**
   * Clear table-specific cache (useful after DDL operations)
   */
  clearTableCache(cfg: MySQLConfig, schema: string, table: string): void {
    const key = this.getTableKey(cfg, schema, table);
    this.columnsCache.delete(key);
    this.primaryKeysCache.delete(key);
    this.tableDetailsCache.delete(key);
    console.log(`[MySQL Cache] Cleared table cache for ${key}`);
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.tableListCache.clear();
    this.columnsCache.clear();
    this.primaryKeysCache.clear();
    this.dbStatsCache.clear();
    this.schemasCache.clear();
    this.tableDetailsCache.clear();
    console.log(`[MySQL Cache] Cleared all caches`);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    tableLists: number;
    columns: number;
    primaryKeys: number;
    dbStats: number;
    schemas: number;
    tableDetails: number;
  } {
    return {
      tableLists: this.tableListCache.size,
      columns: this.columnsCache.size,
      primaryKeys: this.primaryKeysCache.size,
      dbStats: this.dbStatsCache.size,
      schemas: this.schemasCache.size,
      tableDetails: this.tableDetailsCache.size,
    };
  }
}

// Singleton cache manager instance
export const mysqlCache = new MySQLCacheManager();

// Type for DB stats
type DBStats = {
  total_tables: number;
  total_db_size_mb: number;
  total_rows: number;
};

// Legacy cache support (for backward compatibility)
const tableListCache = new Map<
  string,
  { data: TableInfo[]; timestamp: number }
>();

function getCacheKey(cfg: MySQLConfig): string {
  return `${cfg.host}:${cfg.port}:${cfg.database}`;
}

export function createPoolConfig(cfg: MySQLConfig): MySQLConfig & PoolOptions {
  return {
    host: cfg.host,
    port: cfg.port ?? 3306,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
  };
}

export async function testConnection(
  cfg: MySQLConfig
): Promise<{ ok: boolean; message?: string; status: 'connected' | 'disconnected' }> {
  let connection;
  try {
    connection = await mysql.createConnection(cfg);
    return { ok: true, status: 'connected', message: "Connection successful" };
  } catch (err) {
    return { ok: false, message: (err as Error).message, status: 'disconnected' };
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        // Ignore
      }
    }
  }
}

export async function fetchTableData(
  cfg: MySQLConfig,
  schemaName: string,
  tableName: string,
  limit: number,
  page: number
): Promise<{ rows: RowDataPacket[]; total: number }> {
  const pool = mysql.createPool(createPoolConfig(cfg));
  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();

    const safeSchema = `\`${schemaName.replace(/`/g, "``")}\``;
    const safeTable = `\`${tableName.replace(/`/g, "``")}\``;
    const offset = (page - 1) * limit;

    // Get primary keys
    const pkColumns = await listPrimaryKeys(cfg, schemaName, tableName);

    let orderBy = "";
    if (pkColumns.length > 0) {
      const safePks = pkColumns.map(col => `\`${col.replace(/`/g, "``")}\``);
      orderBy = `ORDER BY ${safePks.join(", ")}`;
    } else {
      const colQuery = `
        SELECT COLUMN_NAME
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        ORDER BY ORDINAL_POSITION;
      `;
      const [colRows] = await connection.execute<RowDataPacket[]>(colQuery, [
        schemaName,
        tableName,
      ]);
      const safeCols = colRows.map(r => `\`${r.COLUMN_NAME}\``);
      orderBy = safeCols.length ? `ORDER BY ${safeCols.join(", ")}` : "";
    }

    // Count query
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM ${safeSchema}.${safeTable};
    `;
    const [countRows] = await connection.execute<RowDataPacket[]>(countQuery);
    const total = Number(countRows[0].total);

    const dataQuery = `
      SELECT *
      FROM ${safeSchema}.${safeTable}
      ${orderBy}
      LIMIT ${Number(limit)}
      OFFSET ${Number(offset)};
    `;

    const [rows] = await connection.execute<RowDataPacket[]>(dataQuery);

    return { rows, total };
  } catch (error) {
    throw new Error(`Failed to fetch data: ${(error as Error).message}`);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}


export async function listColumns(
  cfg: MySQLConfig,
  tableName: string,
  schemaName?: string
): Promise<RowDataPacket[]> {
  // Check cache first
  if (schemaName) {
    const cached = mysqlCache.getColumns(cfg, schemaName, tableName);
    if (cached !== null) {
      return cached;
    }
  }

  const pool = mysql.createPool(createPoolConfig(cfg));
  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();

    const query = `
      SELECT 
        column_name, 
        data_type 
      FROM 
        information_schema.columns 
      WHERE 
        table_schema = ? AND table_name = ?
      ORDER BY 
        ordinal_position;
    `;
    const [rows] = await connection.execute<RowDataPacket[]>(query, [
      schemaName,
      tableName,
    ]);

    // Cache the result
    if (schemaName) {
      mysqlCache.setColumns(cfg, schemaName, tableName, rows);
    }

    return rows;
  } catch (error) {
    throw new Error(`Failed to list columns: ${(error as Error).message}`);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

export async function mysqlKillQuery(cfg: MySQLConfig, targetPid: number) {
  const conn = await mysql.createConnection(createPoolConfig(cfg));
  try {
    await conn.execute(`KILL QUERY ?`, [targetPid]);
    return true;
  } catch (error) {
    return false;
  } finally {
    try {
      await conn.end();
    } catch (e) {
      // Ignore
    }
  }
}

export async function listPrimaryKeys(
  cfg: MySQLConfig,
  schemaName: string,
  tableName: string
): Promise<string[]> {
  // Check cache first
  const cached = mysqlCache.getPrimaryKeys(cfg, schemaName, tableName);
  if (cached !== null) {
    return cached;
  }

  const connection = await mysql.createConnection(createPoolConfig(cfg));

  const query = `
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = ?
      AND TABLE_NAME = ?
      AND COLUMN_KEY = 'PRI';
  `;

  try {
    const [rows] = await connection.execute<RowDataPacket[]>(query, [
      schemaName,
      tableName,
    ]);

    const result = rows.map((row) => row.COLUMN_NAME as string);
    
    // Cache the result
    mysqlCache.setPrimaryKeys(cfg, schemaName, tableName, result);

    return result;
  } catch (error) {
    throw new Error(`Failed to list primary keys: ${(error as Error).message}`);
  } finally {
    await connection.end();
  }
}



export function streamQueryCancelable(
  cfg: MySQLConfig,
  sql: string,
  batchSize: number,
  onBatch: (
    rows: RowDataPacket[],
    columns: FieldPacket[]
  ) => Promise<void> | void,
  onDone?: () => void
) {
  let query: any = null;
  let finished = false;
  let cancelled = false;
  let backendPid: number | null = null;

  const pool = mysql.createPool(cfg);

  const promise = (async () => {
    let conn: PoolConnection | null = null;

    try {
      conn = await pool.getConnection();

      const [pidRows] = await conn.execute("SELECT CONNECTION_ID() AS pid");
      backendPid = pidRows[0].pid;

      const raw = (conn as any).connection;
      query = raw.query(sql);

      let columns: FieldPacket[] | null = null;
      let buffer: RowDataPacket[] = [];

      const flush = async () => {
        if (buffer.length === 0) return;
        const batch = buffer.splice(0, buffer.length);
        await onBatch(batch, columns || []);
      };

      await new Promise<void>((resolve, reject) => {
        query.on("fields", (flds: FieldPacket[]) => {
          columns = flds;
        });

        query.on("result", async (row: RowDataPacket) => {
          if (cancelled) {
            reject(new Error("Query cancelled"));
            return;
          }

          buffer.push(row);

          if (buffer.length >= batchSize) {
            query.pause();
            await flush();
            query.resume();
          }
        });

        query.on("end", async () => {
          await flush();
          finished = true;
          onDone?.();
          resolve();
        });

        query.on("error", (err: Error) => {
          reject(err);
        });
      });
    } finally {
      conn?.release();
      await pool.end();
    }
  })();

  async function cancel() {
    if (finished || cancelled) return;
    cancelled = true;

    if (backendPid) {
      await mysqlKillQuery(cfg, backendPid).catch(() => { });
    }

    query?.emit("error", new Error("Cancelled"));
  }

  return { promise, cancel };
}

export interface ColumnDetail {
  name: string;
  type: string;
  not_nullable: boolean;
  default_value: string | null;
  is_primary_key: boolean;
  is_foreign_key: boolean;
}

export interface TableInfo {
  schema: string;
  name: string;
  type: string;
}

export async function getDBStats(cfg: MySQLConfig): Promise<{
  total_tables: number;
  total_db_size_mb: number;
  total_rows: number;
}> {
  // Check cache first - this is called frequently!
  const cached = mysqlCache.getDBStats(cfg);
  if (cached !== null) {
    return cached;
  }

  const pool = mysql.createPool(createPoolConfig(cfg));
  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();

    // MODIFIED: Added SUM(table_rows) AS total_rows
    const query = `
      SELECT
        COUNT(*) AS total_tables,
        SUM(table_rows) AS total_rows,  -- <-- NEW: Aggregated row count
        COALESCE(
          ROUND(SUM(data_length + index_length) / (1024 * 1024), 2),
          0
        ) AS total_db_size_mb
      FROM 
        information_schema.tables
      WHERE 
        table_schema = DATABASE() 
        AND table_type = 'BASE TABLE';
    `;

    const [rows] = await connection.execute<RowDataPacket[]>(query);
    
    const result = rows[0] as {
      total_tables: number;
      total_db_size_mb: number;
      total_rows: number;
    };

    // Cache the result (shorter TTL since stats change)
    mysqlCache.setDBStats(cfg, result);

    return result;
  } catch (error) {
    throw new Error(
      `Failed to fetch MySQL database stats: ${(error as Error).message}`
    );
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (e) {
        // Ignore
      }
    }
    try {
      await pool.end();
    } catch (e) {
      // Ignore
    }
  }
}

export async function listSchemas(
  cfg: MySQLConfig
): Promise<{ name: string }[]> {
  // Check cache first
  const cached = mysqlCache.getSchemas(cfg);
  if (cached !== null) {
    return cached;
  }

  const pool = mysql.createPool(createPoolConfig(cfg));
  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();

    const query = `
      SELECT
        schema_name AS name
      FROM
        information_schema.schemata
      WHERE
        schema_name NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
      ORDER BY
        schema_name;
    `;

    const [rows] = await connection.execute<RowDataPacket[]>(query);
    const result = rows as { name: string }[];

    // Cache the result (longer TTL since schemas rarely change)
    mysqlCache.setSchemas(cfg, result);

    return result;
  } catch (error) {
    throw new Error(`Failed to list schemas: ${(error as Error).message}`);
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (e) {
        // Ignore
      }
    }
    try {
      await pool.end();
    } catch (e) {
      // Ignore
    }
  }
}

export async function listTables(
  cfg: MySQLConfig,
  schemaName?: string
): Promise<TableInfo[]> {
  // Check new cache manager first
  const cached = mysqlCache.getTableList(cfg, schemaName);
  if (cached !== null) {
    return cached;
  }

  const pool = mysql.createPool(createPoolConfig(cfg));
  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();

    // CRITICAL OPTIMIZATION: Query only the current database schema
    // This avoids scanning the entire information_schema which can be VERY slow
    let query: string;
    let queryParams: string[] = [];

    if (schemaName) {
      // If specific schema requested, only fetch that
      query = `
        SELECT 
          table_schema AS \`schema\`, 
          table_name AS name, 
          table_type AS type 
        FROM 
          information_schema.tables
        WHERE 
          table_schema = ?
          AND table_type IN ('BASE TABLE', 'VIEW')
        ORDER BY table_name;
      `;
      queryParams = [schemaName];
    } else {
      // Otherwise, only fetch tables from the CURRENT database (not all databases!)
      query = `
        SELECT 
          table_schema AS \`schema\`, 
          table_name AS name, 
          table_type AS type 
        FROM 
          information_schema.tables
        WHERE 
          table_schema = DATABASE()
          AND table_type IN ('BASE TABLE', 'VIEW')
        ORDER BY table_name;
      `;
    }

    console.log(
      `[MySQL] Executing listTables query for schema: ${schemaName || "DATABASE()"
      }`
    );
    const startTime = Date.now();

    const [rows] = await connection.execute<RowDataPacket[]>(
      query,
      queryParams
    );

    const elapsed = Date.now() - startTime;
    console.log(
      `[MySQL] listTables completed in ${elapsed}ms, found ${rows.length} tables`
    );

    const result = rows as TableInfo[];

    // Cache the result using new cache manager
    mysqlCache.setTableList(cfg, result, schemaName);

    return result;
  } catch (error) {
    console.error("[MySQL] listTables error:", error);
    throw new Error(`Failed to list tables: ${(error as Error).message}`);
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (e) {
        // Ignore
      }
    }
    try {
      await pool.end();
    } catch (e) {
      // Ignore
    }
  }
}

// Function to clear cache for a specific database (call after schema changes)
export function clearTableListCache(cfg: MySQLConfig) {
  mysqlCache.clearForConnection(cfg);
}

export async function getTableDetails(
  cfg: MySQLConfig,
  schemaName: string,
  tableName: string
): Promise<ColumnDetail[]> {
  // Check cache first
  const cached = mysqlCache.getTableDetails(cfg, schemaName, tableName);
  if (cached !== null) {
    return cached;
  }

  const pool = mysql.createPool(createPoolConfig(cfg));
  let connection: PoolConnection | null = null;

  try {
    connection = await pool.getConnection();

    const query = `
      SELECT
        c.COLUMN_NAME AS name,
        c.DATA_TYPE AS type,
        (c.IS_NULLABLE = 'NO') AS not_nullable,
        c.COLUMN_DEFAULT AS default_value,
        (c.COLUMN_KEY = 'PRI') AS is_primary_key,
        EXISTS (
          SELECT 1
          FROM information_schema.key_column_usage kcu
          JOIN information_schema.table_constraints tc 
            ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
            AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
            AND tc.TABLE_NAME = kcu.TABLE_NAME
          WHERE
            tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
            AND kcu.TABLE_SCHEMA = c.TABLE_SCHEMA
            AND kcu.TABLE_NAME = c.TABLE_NAME
            AND kcu.COLUMN_NAME = c.COLUMN_NAME
        ) AS is_foreign_key
      FROM
        information_schema.columns c
      WHERE
        c.TABLE_SCHEMA = ? AND c.TABLE_NAME = ?
      ORDER BY
        c.ORDINAL_POSITION;
    `;

    const [rows] = await connection.execute<RowDataPacket[]>(query, [
      schemaName,
      tableName,
    ]);

    const result = rows as ColumnDetail[];

    // Cache the result
    mysqlCache.setTableDetails(cfg, schemaName, tableName, result);

    return result;
  } catch (error) {
    throw new Error(
      `Failed to fetch table details: ${(error as Error).message}`
    );
  } finally {
    if (connection) {
      try {
        connection.release();
      } catch (e) {
        // Ignore
      }
    }
    try {
      await pool.end();
    } catch (e) {
      // Ignore
    }
  }
}
