
export type DatabaseType = "postgresql" | "mysql" | "mongodb" | "sqlite";

export interface DatabaseConnection {
    id: string;
    name: string;
    type: string;
    host: string;
    port: number;
    user: string;
    database: string;
    tags?: string[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
    credentialId?: string;
}

export interface AddDatabaseParams {
    name: string;
    type: string;
    host: string;
    port: number;
    user: string;
    database: string;
    password?: string;
    notes?: string;
    tags?: string[];
    ssl?: boolean;
    sslmode?: string;
}

export interface UpdateDatabaseParams {
    id: string;
    name?: string;
    host?: string;
    port?: number;
    user?: string;
    database?: string;
    password?: string;
    notes?: string;
    tags?: string[];
}

export interface ConnectionTestResult {
    ok: boolean;
    message?: string;
}

// --- NEW INTERFACES FOR QUERY/SESSION HANDLING ---

export interface TableRow extends Record<string, any> { }

export interface TableColumn {
    name: string;
    // Add other metadata fields as needed (e.g., dataType, nullable)
}

// Interface for initiating a query
export interface RunQueryParams {
    sessionId: string;
    dbId: string;
    sql: string;
    batchSize?: number;
}

// --- NEW INTERFACES FOR SCHEMA EXPLORER ---

export interface ColumnDetails {
    name: string;
    type: string;
    nullable: boolean;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    isUnique: boolean; // Note: Requires extra backend query, mocked to false for simplicity
    defaultValue: string | null;
}

export interface TableSchemaDetails {
    name: string;
    type: "BASE TABLE" | "VIEW" | string;
    columns: ColumnDetails[];
}

export interface SchemaGroup {
    name: string;
    tables: TableSchemaDetails[];
}

export interface DatabaseSchemaDetails {
    name: string;
    schemas: SchemaGroup[];
}

export interface DatabaseStats {
    rows: number;
    sizeBytes: number;
    tables: number;
}

export interface TableInfo {
  schema: string;
  name: string;
  type: string;
}

export interface SelectedTable {
  schema: string;
  name: string;
}

export interface QueryProgress {
  rows: number;
  elapsed: number;
}