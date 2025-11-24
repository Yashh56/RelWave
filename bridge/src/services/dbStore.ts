import path from "path";
import os from "os";
import fs from "fs/promises";
import fsSync from "fs";
import { v4 as uuidv4 } from "uuid";
import keytar from "keytar";

const CONFIG_FOLDER =
  process.env.DBVISUALIZER_HOME ||
  path.join(
    os.homedir(),
    process.platform === "win32"
      ? "AppData\\Roaming\\DBVisualizer"
      : ".dbvisualizer"
  );

const CONFIG_FILE = path.join(CONFIG_FOLDER, "databases.json");

type DBMeta = {
  id: string;
  name: string;
  host: string;
  port: number;
  user: string;
  database: string;
  credentialId?: string;
  notes?: string;
  tags?: string[];
  ssl?: boolean;
  sslmode?: string;
  createdAt: string;
  updatedAt: string;
};

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
    await keytar.setPassword("db-visualizer", credentialId, payload.password);
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
    await keytar.setPassword("db-visualizer", credentialId, patch.password);
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
  if (meta.credentialId)
    await keytar.deletePassword("db-visualizer", meta.credentialId);
  return true;
}

export async function getPasswordFor(meta: DBMeta) {
  if (!meta.credentialId) return null;
  return await keytar.getPassword("db-visualizer", meta.credentialId);
}
