// ----------------------------
// services/projectStore.ts
// ----------------------------

import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { v4 as uuidv4 } from "uuid";
import {
    PROJECTS_FOLDER,
    PROJECTS_INDEX_FILE,
    getProjectDir,
    ensureDir,
} from "../utils/config";
import { dbStoreInstance, DBMeta } from "./dbStore";

// ==========================================
// Types
// ==========================================

export type ProjectMetadata = {
    version: number;
    id: string;
    databaseId: string;
    name: string;
    description?: string;
    engine?: string;
    defaultSchema?: string;
    createdAt: string;
    updatedAt: string;
};

export type SavedQuery = {
    id: string;
    name: string;
    sql: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
};

export type QueriesFile = {
    version: number;
    projectId: string;
    queries: SavedQuery[];
};

export type ERNode = {
    tableId: string;
    x: number;
    y: number;
    width?: number;
    height?: number;
    collapsed?: boolean;
};

export type ERDiagramFile = {
    version: number;
    projectId: string;
    nodes: ERNode[];
    zoom?: number;
    panX?: number;
    panY?: number;
    updatedAt: string;
};

export type SchemaFile = {
    version: number;
    projectId: string;
    databaseId: string;
    schemas: SchemaSnapshot[];
    cachedAt: string;
};

export type SchemaSnapshot = {
    name: string;
    tables: TableSnapshot[];
};

export type TableSnapshot = {
    name: string;
    type: string;
    columns: ColumnSnapshot[];
};

export type ColumnSnapshot = {
    name: string;
    type: string;
    nullable: boolean;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    defaultValue: string | null;
    isUnique: boolean;
};

export type ProjectSummary = Pick<
    ProjectMetadata,
    "id" | "name" | "description" | "engine" | "databaseId" | "createdAt" | "updatedAt"
>;



type ProjectIndex = {
    version: number;
    projects: ProjectSummary[];
};


const PROJECT_FILES = {
    metadata: "relwave.json",
    schema: path.join("schema", "schema.json"),
    erDiagram: path.join("diagrams", "er.json"),
    queries: path.join("queries", "queries.json"),
} as const;

export class ProjectStore {
    private projectsFolder: string;
    private indexFile: string;

    constructor(
        projectsFolder: string = PROJECTS_FOLDER,
        indexFile: string = PROJECTS_INDEX_FILE
    ) {
        this.projectsFolder = projectsFolder;
        this.indexFile = indexFile;
    }

    private projectDir(projectId: string): string {
        return getProjectDir(projectId);
    }

    private projectFile(projectId: string, file: string): string {
        return path.join(this.projectDir(projectId), file);
    }

    /**
     * Ensure the project directory and sub-folders exist
     */
    private async ensureProjectDirs(projectId: string): Promise<void> {
        const base = this.projectDir(projectId);
        ensureDir(base);
        ensureDir(path.join(base, "schema"));
        ensureDir(path.join(base, "diagrams"));
        ensureDir(path.join(base, "queries"));
    }

    /**
     * Read and parse a JSON file, returns null if missing
     */
    private async readJSON<T>(filePath: string): Promise<T | null> {
        try {
            if (!fsSync.existsSync(filePath)) return null;
            const raw = await fs.readFile(filePath, "utf-8");
            return JSON.parse(raw) as T;
        } catch {
            return null;
        }
    }

    /**
     * Write JSON atomically (write to tmp then rename)
     */
    private async writeJSON(filePath: string, data: unknown): Promise<void> {
        const dir = path.dirname(filePath);
        ensureDir(dir);
        const tmp = `${filePath}.${process.pid}.${uuidv4()}.tmp`;
        await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8");
        await fs.rename(tmp, filePath);
    }

    private async loadIndex(): Promise<ProjectIndex> {
        const data = await this.readJSON<ProjectIndex>(this.indexFile);
        return data ?? { version: 1, projects: [] };
    }

    private async saveIndex(index: ProjectIndex): Promise<void> {
        ensureDir(this.projectsFolder);
        await this.writeJSON(this.indexFile, index);
    }


    /**
     * List all projects (lightweight, from index)
     */
    async listProjects(): Promise<ProjectSummary[]> {
        const index = await this.loadIndex();
        return index.projects;
    }

    /**
     * Get full project metadata
     */
    async getProject(projectId: string): Promise<ProjectMetadata | null> {
        return this.readJSON<ProjectMetadata>(
            this.projectFile(projectId, PROJECT_FILES.metadata)
        );
    }

    /**
     * Find a project linked to a specific database ID.
     * Returns the first matching project or null.
     */
    async getProjectByDatabaseId(databaseId: string): Promise<ProjectMetadata | null> {
        const index = await this.loadIndex();
        const entry = index.projects.find((p) => p.databaseId === databaseId);
        if (!entry) return null;
        return this.getProject(entry.id);
    }

    /**
     * Create a new project linked to a database connection
     */
    async createProject(params: {
        databaseId: string;
        name: string;
        description?: string;
        defaultSchema?: string;
    }): Promise<ProjectMetadata> {
        // Resolve engine from the linked database
        let engine: string | undefined;
        try {
            const db: DBMeta | null = await dbStoreInstance.getDB(params.databaseId);
            engine = db?.type;
        } catch {
            // db may not exist yet — that's OK
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        const meta: ProjectMetadata = {
            version: 1,
            id,
            databaseId: params.databaseId,
            name: params.name,
            description: params.description,
            engine,
            defaultSchema: params.defaultSchema,
            createdAt: now,
            updatedAt: now,
        };

        // Create project directory structure
        await this.ensureProjectDirs(id);

        // Write metadata
        await this.writeJSON(
            this.projectFile(id, PROJECT_FILES.metadata),
            meta
        );

        // Initialise empty sub-files
        const emptySchema: SchemaFile = {
            version: 1,
            projectId: id,
            databaseId: params.databaseId,
            schemas: [],
            cachedAt: now,
        };
        const emptyER: ERDiagramFile = {
            version: 1,
            projectId: id,
            nodes: [],
            updatedAt: now,
        };
        const emptyQueries: QueriesFile = {
            version: 1,
            projectId: id,
            queries: [],
        };

        await Promise.all([
            this.writeJSON(this.projectFile(id, PROJECT_FILES.schema), emptySchema),
            this.writeJSON(this.projectFile(id, PROJECT_FILES.erDiagram), emptyER),
            this.writeJSON(this.projectFile(id, PROJECT_FILES.queries), emptyQueries),
        ]);

        // Update global index
        const index = await this.loadIndex();
        index.projects.push({
            id,
            name: meta.name,
            description: meta.description,
            engine,
            databaseId: meta.databaseId,
            createdAt: now,
            updatedAt: now,
        });
        await this.saveIndex(index);

        return meta;
    }

    /**
     * Update project metadata (name, description, defaultSchema)
     */
    async updateProject(
        projectId: string,
        updates: Partial<Pick<ProjectMetadata, "name" | "description" | "defaultSchema">>
    ): Promise<ProjectMetadata | null> {
        const meta = await this.getProject(projectId);
        if (!meta) return null;

        const now = new Date().toISOString();

        // Whitelist only allowed fields from updates to avoid overwriting
        // sensitive metadata (e.g., id, databaseId, version, timestamps).
        const { name, description, defaultSchema } = updates;
        const safeUpdates: Partial<Pick<ProjectMetadata, "name" | "description" | "defaultSchema">> = {};
        if (name !== undefined) {
            safeUpdates.name = name;
        }
        if (description !== undefined) {
            safeUpdates.description = description;
        }
        if (defaultSchema !== undefined) {
            safeUpdates.defaultSchema = defaultSchema;
        }

        const updated: ProjectMetadata = {
            ...meta,
            ...safeUpdates,
            updatedAt: now,
        };

        await this.writeJSON(
            this.projectFile(projectId, PROJECT_FILES.metadata),
            updated
        );

        // Sync the index entry
        const index = await this.loadIndex();
        const entry = index.projects.find((p) => p.id === projectId);
        if (entry) {
            if (updates.name !== undefined) entry.name = updates.name;
            if (updates.description !== undefined) entry.description = updates.description;
            entry.updatedAt = now;
            await this.saveIndex(index);
        }

        return updated;
    }

    /**
     * Delete a project and its directory
     */
    async deleteProject(projectId: string): Promise<void> {
        const dir = this.projectDir(projectId);
        if (fsSync.existsSync(dir)) {
            await fs.rm(dir, { recursive: true, force: true });
        }

        // Remove from index
        const index = await this.loadIndex();
        index.projects = index.projects.filter((p) => p.id !== projectId);
        await this.saveIndex(index);
    }

    async getSchema(projectId: string): Promise<SchemaFile | null> {
        return this.readJSON<SchemaFile>(
            this.projectFile(projectId, PROJECT_FILES.schema)
        );
    }

    async saveSchema(projectId: string, schemas: SchemaSnapshot[]): Promise<SchemaFile> {
        const meta = await this.getProject(projectId);
        if (!meta) throw new Error(`Project ${projectId} not found`);

        const now = new Date().toISOString();
        const file: SchemaFile = {
            version: 1,
            projectId,
            databaseId: meta.databaseId,
            schemas,
            cachedAt: now,
        };

        await this.writeJSON(
            this.projectFile(projectId, PROJECT_FILES.schema),
            file
        );

        return file;
    }

    async getERDiagram(projectId: string): Promise<ERDiagramFile | null> {
        return this.readJSON<ERDiagramFile>(
            this.projectFile(projectId, PROJECT_FILES.erDiagram)
        );
    }

    async saveERDiagram(
        projectId: string,
        data: Pick<ERDiagramFile, "nodes" | "zoom" | "panX" | "panY">
    ): Promise<ERDiagramFile> {
        const now = new Date().toISOString();
        const file: ERDiagramFile = {
            version: 1,
            projectId,
            nodes: data.nodes,
            zoom: data.zoom,
            panX: data.panX,
            panY: data.panY,
            updatedAt: now,
        };

        await this.writeJSON(
            this.projectFile(projectId, PROJECT_FILES.erDiagram),
            file
        );

        return file;
    }

    async getQueries(projectId: string): Promise<QueriesFile | null> {
        return this.readJSON<QueriesFile>(
            this.projectFile(projectId, PROJECT_FILES.queries)
        );
    }

    async addQuery(
        projectId: string,
        params: { name: string; sql: string; description?: string }
    ): Promise<SavedQuery> {
        const file = (await this.getQueries(projectId)) ?? {
            version: 1,
            projectId,
            queries: [],
        };

        const now = new Date().toISOString();
        const query: SavedQuery = {
            id: uuidv4(),
            name: params.name,
            sql: params.sql,
            description: params.description,
            createdAt: now,
            updatedAt: now,
        };

        file.queries.push(query);

        await this.writeJSON(
            this.projectFile(projectId, PROJECT_FILES.queries),
            file
        );

        return query;
    }

    async updateQuery(
        projectId: string,
        queryId: string,
        updates: Partial<Pick<SavedQuery, "name" | "sql" | "description">>
    ): Promise<SavedQuery | null> {
        const file = await this.getQueries(projectId);
        if (!file) return null;

        const idx = file.queries.findIndex((q) => q.id === queryId);
        if (idx === -1) return null;

        const now = new Date().toISOString();
        file.queries[idx] = {
            ...file.queries[idx],
            ...updates,
            updatedAt: now,
        };

        await this.writeJSON(
            this.projectFile(projectId, PROJECT_FILES.queries),
            file
        );

        return file.queries[idx];
    }

    async deleteQuery(projectId: string, queryId: string): Promise<void> {
        const file = await this.getQueries(projectId);
        if (!file) return;

        file.queries = file.queries.filter((q) => q.id !== queryId);

        await this.writeJSON(
            this.projectFile(projectId, PROJECT_FILES.queries),
            file
        );
    }

    /**
     * Returns the full project bundle — useful for export / git commit
     */
    async exportProject(projectId: string): Promise<{
        metadata: ProjectMetadata;
        schema: SchemaFile | null;
        erDiagram: ERDiagramFile | null;
        queries: QueriesFile | null;
    } | null> {
        const metadata = await this.getProject(projectId);
        if (!metadata) return null;

        const [schema, erDiagram, queries] = await Promise.all([
            this.getSchema(projectId),
            this.getERDiagram(projectId),
            this.getQueries(projectId),
        ]);

        return { metadata, schema, erDiagram, queries };
    }
}

// Singleton instance
export const projectStoreInstance = new ProjectStore();