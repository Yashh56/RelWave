import { useState, useCallback } from "react";
import { bridgeApi } from "@/services/bridgeApi";
import { DiscoveredDatabase } from "@/types/database";

interface UseDiscoveredDatabasesReturn {
    databases: DiscoveredDatabase[];
    isScanning: boolean;
    error: string | null;
    scan: () => Promise<void>;
    lastScanned: Date | null;
}

/**
 * Hook for discovering locally running databases
 * Scans localhost ports and Docker containers for PostgreSQL, MySQL, and MariaDB
 */
export function useDiscoveredDatabases(): UseDiscoveredDatabasesReturn {
    const [databases, setDatabases] = useState<DiscoveredDatabase[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastScanned, setLastScanned] = useState<Date | null>(null);

    const scan = useCallback(async () => {
        setIsScanning(true);
        setError(null);

        try {
            const discovered = await bridgeApi.discoverDatabases();
            setDatabases(discovered);
            setLastScanned(new Date());
        } catch (err: any) {
            setError(err.message || "Failed to scan for databases");
            setDatabases([]);
        } finally {
            setIsScanning(false);
        }
    }, []);

    return {
        databases,
        isScanning,
        error,
        scan,
        lastScanned,
    };
}
