import path from "path";
import os from "os";
import fs from "fs/promises";
import fsSync from "fs";
import { v4 as uuidv4 } from "uuid";
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const CONFIG_FOLDER =
  process.env.DBVISUALIZER_HOME ||
  path.join(
    os.homedir(),
    process.platform === "win32"
      ? "AppData\\Roaming\\DBVisualizer"
      : ".dbvisualizer"
  );

const CONFIG_FILE = path.join(CONFIG_FOLDER, "databases.json");
const CREDENTIALS_FILE = path.join(CONFIG_FOLDER, ".credentials");

// Use machine-specific key for encryption
const ENCRYPTION_KEY_SOURCE = os.hostname() + os.userInfo().username;

type DBMeta = {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  database: string;
  type?: string; // postgres or mysql
  credentialId?: string;
  notes?: string;
  tags?: string[];
  ssl?: boolean;
  sslmode?: string;
  createdAt: string;
  updatedAt: string;
};

type CredentialStore = {
  [key: string]: string;
};

// Encrypt password
async function encryptPassword(password: string): Promise<string> {
  const iv = randomBytes(16);
  const key = (await scryptAsync(ENCRYPTION_KEY_SOURCE, "salt", 32)) as Buffer;
  const cipher = createCipheriv("aes-256-cbc", key, iv);
  
  const encrypted = Buffer.concat([
    cipher.update(password, "utf8"),
    cipher.final(),
  ]);
  
  // Return IV + encrypted data as base64
  return Buffer.concat([iv, encrypted]).toString("base64");
}

// Decrypt password
async function decryptPassword(encryptedData: string): Promise<string> {
  const buffer = Buffer.from(encryptedData, "base64");
  const iv = buffer.slice(0, 16);
  const encrypted = buffer.slice(16);
  
  const key = (await scryptAsync(ENCRYPTION_KEY_SOURCE, "salt", 32)) as Buffer;
  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  
  return decrypted.toString("utf8");
}

// Load credentials from file
async function loadCredentials(): Promise<CredentialStore> {
  try {
    if (!fsSync.existsSync(CREDENTIALS_FILE)) {
      return {};
    }
    const data = await fs.readFile(CREDENTIALS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Failed to load credentials:", error);
    return {};
  }
}

// Save credentials to file
async function saveCredentials(credentials: CredentialStore): Promise<void> {
  try {
    await fs.writeFile(
      CREDENTIALS_FILE,
      JSON.stringify(credentials, null, 2),
      "utf-8"
    );
    // Set file permissions to user-only (Unix systems)
    if (process.platform !== "win32") {
      await fs.chmod(CREDENTIALS_FILE, 0o600);
    }
  } catch (error) {
    console.error("Failed to save credentials:", error);
    throw new Error("Failed to store credentials securely");
  }
}

async function ensureConfigDir() {
  // Create directory if it doesn't exist
  if (!fsSync.existsSync(CONFIG_FOLDER)) {
    await fs.mkdir(CONFIG_FOLDER, { recursive: true });
  }

  // Create empty config file if it doesn't exist
  if (!fsSync.existsSync(CONFIG_FILE)) {
    await fs.writeFile(
      CONFIG_FILE,
      JSON.stringify({ version: 1, databases: [] }, null, 2),
      "utf-8"
    );
  }
}

async function loadAll(): Promise<{ version: number; databases: DBMeta[] }> {
  await ensureConfigDir();
  const txt = await fs.readFile(CONFIG_FILE, "utf-8");
  return JSON.parse(txt);
}

async function saveAll(data: {
  version: number;
  databases: DBMeta[];
}): Promise<void> {
  // Only ensure directory exists, don't call ensureConfigDir to avoid recursion
  if (!fsSync.existsSync(CONFIG_FOLDER)) {
    await fs.mkdir(CONFIG_FOLDER, { recursive: true });
  }
  await fs.writeFile(CONFIG_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function listDBs() {
  const all = await loadAll();
  return all.databases;
}

export async function getDB(id: string) {
  const all = await loadAll();
  return all.databases.find((db) => db.id === id);
}

export async function addDB(payload: {
  name: string;
  host: string;
  port: number;
  user: string;
  database: string;
  type?: string;
  ssl?: boolean;
  sslmode?: string;
  password?: string;
  notes?: string;
  tags?: string[];
}) {
  const all = await loadAll();
  const id = uuidv4();
  const now = new Date().toISOString();
  const credentialId = payload.password ? `db_${id}` : undefined;
  const meta: DBMeta = {
    id,
    name: payload.name,
    host: payload.host,
    port: payload.port,
    user: payload.user,
    database: payload.database,
    type: payload.type,
    ssl: payload.ssl,
    sslmode: payload.sslmode,
    credentialId,
    notes: payload.notes,
    tags: payload.tags || [],
    createdAt: now,
    updatedAt: now,
  };

  all.databases.push(meta);
  await saveAll(all);
  
  if (payload.password && credentialId) {
    try {
      const credentials = await loadCredentials();
      credentials[credentialId] = await encryptPassword(payload.password);
      await saveCredentials(credentials);
    } catch (error) {
      console.error("Failed to store password:", error);
      // Optionally handle error - you might want to throw or handle gracefully
    }
  }
  
  return meta;
}

export async function updateDB(
  id: string,
  patch: Partial<DBMeta> & { password?: string }
) {
  const all = await loadAll();
  const idx = all.databases.findIndex((db) => db.id === id);
  if (idx === -1) throw new Error("Database not found");
  const now = new Date().toISOString();
  const curr = all.databases[idx];
  const updated = {
    ...curr,
    ...patch,
    updatedAt: now,
  };
  
  if (patch.password) {
    const credentialId = updated.credentialId || `db_${id}`;
    updated.credentialId = credentialId;
    
    try {
      const credentials = await loadCredentials();
      credentials[credentialId] = await encryptPassword(patch.password);
      await saveCredentials(credentials);
    } catch (error) {
      console.error("Failed to update password:", error);
      throw new Error("Failed to store password securely");
    }
  }
  
  all.databases[idx] = updated;
  await saveAll(all);
  return true;
}

export async function deleteDB(id: string) {
  const all = await loadAll();
  const idx = all.databases.findIndex((db) => db.id === id);
  if (idx === -1) throw new Error("Database not found");
  const meta = all.databases[idx];
  all.databases.splice(idx, 1);
  await saveAll(all);
  
  if (meta.credentialId) {
    try {
      const credentials = await loadCredentials();
      delete credentials[meta.credentialId];
      await saveCredentials(credentials);
    } catch (error) {
      console.error("Failed to delete password:", error);
      // Continue anyway since the database entry is already removed
    }
  }
  
  return true;
}

export async function getPasswordFor(meta: DBMeta): Promise<string | null> {
  if (!meta.credentialId) return null;
  
  try {
    const credentials = await loadCredentials();
    const encrypted = credentials[meta.credentialId];
    if (!encrypted) return null;
    return await decryptPassword(encrypted);
  } catch (error) {
    console.error("Failed to retrieve password:", error);
    return null;
  }
}