import { Link } from "react-router-dom";
import { Database, Table2, HardDrive, Activity, Trash2, TestTube, MoreVertical, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect, useState, useMemo } from "react";
import { bridgeApi } from "@/services/bridgeApi";

interface DatabaseCardProps {
  id: string;
  name: string;
  type: string;
  status: Map<string, string> | [string, string][] | string;
  host: string;
  onDelete?: () => void;
  onTest?: () => void;
}

interface DatabaseStats {
  stats: {
    total_tables: string;
    total_db_size: string;
    total_db_size_mb: string;
  },
  db: {
    id: string;
    name: string;
    port: number;
    host: string;
    type: string;
    ssl?: boolean;
    created_at: string;
    updated_at: string;
    user: string;
    sslmode?: string;
    database: string;
    tags?: string[];
    credentialId?: string;
  }
}

export const DatabaseCard = ({
  id,
  name,
  type,
  status,
  host,
  onDelete,
  onTest
}: DatabaseCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [result, setResult] = useState<DatabaseStats | null>(null);

  // Memoize the status extraction to prevent unnecessary recalculations
  const currentStatus = useMemo(() => {
    if (typeof status === "string") return status;

    if (status instanceof Map) {
      return status.get(id) || "disconnected";
    }

    if (Array.isArray(status)) {
      const entry = status.find(([dbId]) => dbId === id);
      return entry ? entry[1] : "disconnected";
    }

    return "disconnected";
  }, [status, id]);

  const isConnected = currentStatus === "connected";

  // Enhanced Visual Styles
  const statusColorClass = isConnected
    ? "bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/50 shadow-sm shadow-emerald-500/20"
    : "bg-gradient-to-r from-red-500/20 to-red-400/10 text-red-600 dark:text-red-400 border-red-500/50 shadow-sm shadow-red-500/20";

  const iconBgClass = isConnected
    ? "bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30"
    : "bg-gradient-to-br from-red-500/20 to-red-400/10 border border-red-500/30";

  const iconColor = isConnected ? "text-primary" : "text-red-500";

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleTest = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTest?.();
  };

  const confirmDelete = () => {
    setShowDeleteDialog(false);
    onDelete?.();
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await bridgeApi.getDatabaseStats(id);
        if (res && typeof res === "object" && "stats" in res && "db" in res) {
          setResult(res as DatabaseStats);
        } else {
          setResult(null);
        }
      } catch (error) {
        console.error("Failed to load stats for", id, error);
      }
    }
    loadStats();
  }, [id]);

  return (
    <>
      <Card className="group relative bg-gradient-to-br from-background via-background to-primary/5 border-2 border-primary/20 rounded-2xl shadow-xl transition-all duration-300 cursor-pointer h-full hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/40 hover:scale-[1.02] overflow-hidden">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        
        {/* Decorative corner accents */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="p-4 sm:p-6 relative z-10">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/${id}`} className="flex items-center gap-3 min-w-0 flex-1 pr-1">
              <div className="relative group/icon">
                {/* Glow effect for icon */}
                <div className={`absolute inset-0 ${isConnected ? 'bg-primary/30' : 'bg-red-500/30'} rounded-xl blur-md group-hover:blur-lg transition-all duration-300 opacity-50`} />
                <div className={`relative p-3 rounded-xl transition-all duration-300 shrink-0 ${iconBgClass} group-hover:scale-110`}>
                  <Database className={`h-6 w-6 ${iconColor}`} />
                </div>
              </div>

              <div className="truncate min-w-0 flex-1">
                <CardTitle className="text-xl mb-1 font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary transition-all duration-300 truncate">
                  {name}
                </CardTitle>
                <CardDescription className="font-mono text-xs text-muted-foreground/80 truncate flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-primary/40" />
                  {host.length > 30 && host !== 'localhost' ? `${host.slice(0, 15)}...${host.slice(-15)}` : host}
                </CardDescription>
              </div>
            </Link>

            <div className="flex items-center gap-1 shrink-0 ml-1">
              <Badge
                variant="outline"
                className={`hidden sm:flex items-center gap-1.5 font-semibold uppercase px-3 py-1.5 rounded-full ${statusColorClass} transition-all duration-300`}
              >
                <span className="relative flex h-2 w-2">
                  {isConnected && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <Activity className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "text-emerald-500" : "text-red-500"}`} />
                </span>
                {currentStatus}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent transition-all duration-300 rounded-xl border border-transparent hover:border-primary/30"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gradient-to-br from-popover via-popover to-primary/5 border-2 border-primary/20 rounded-xl shadow-2xl backdrop-blur-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none rounded-xl" />
                  <div className="relative z-10 p-1">
                    <DropdownMenuItem 
                      onClick={handleTest} 
                      className="cursor-pointer rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent border border-transparent hover:border-primary/20 transition-all duration-300"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-primary/10 border border-primary/20">
                          <TestTube className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="font-medium">Test Connection</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-primary/20 my-1" />
                    <DropdownMenuItem 
                      onClick={handleDelete} 
                      className="cursor-pointer rounded-lg hover:bg-gradient-to-r hover:from-red-500/10 hover:to-transparent border border-transparent hover:border-red-500/20 transition-all duration-300"
                    >
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <div className="p-1 rounded bg-red-500/10 border border-red-500/20">
                          <Trash2 className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-medium">Delete Connection</span>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <Link to={`/${id}`}>
          <CardContent className="p-4 sm:p-6 pt-0 relative z-10">
            <div className="space-y-4 pt-2">
              {/* Database Engine */}
              <div className="flex items-center justify-between text-sm pb-3 border-b border-primary/20">
                <span className="text-muted-foreground/80 flex items-center gap-1.5 font-medium">
                  <div className="h-1 w-1 rounded-full bg-primary/40" />
                  Database Engine
                </span>
                <span className="font-mono font-semibold text-foreground px-3 py-1 rounded-lg bg-gradient-to-r from-primary/10 to-accent/5 border border-primary/20 truncate max-w-[50%]">
                  {type}
                </span>
              </div>

              {/* Total Tables */}
              <div className="group/stat flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-violet-500/5 to-transparent border border-violet-500/20 hover:border-violet-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10">
                <span className="text-muted-foreground flex items-center gap-2 shrink-0">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-400/10 border border-violet-500/30">
                    <Table2 className="h-4 w-4 text-violet-500" />
                  </div>
                  <span className="font-medium">Total Tables</span>
                </span>
                <span className="font-mono font-bold text-xl text-foreground group-hover/stat:text-violet-500 transition-colors duration-300">
                  {result ? parseInt(result.stats.total_tables).toLocaleString() : 0}
                </span>
              </div>

              {/* Storage Used */}
              <div className="group/stat flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/5 to-transparent border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10">
                <span className="text-muted-foreground flex items-center gap-2 shrink-0">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-400/10 border border-amber-500/30">
                    <HardDrive className="h-4 w-4 text-amber-500" />
                  </div>
                  <span className="font-medium">Storage Used</span>
                </span>
                <span className="font-mono font-bold text-xl text-foreground group-hover/stat:text-amber-500 transition-colors duration-300">
                  {result ? `${parseFloat(result.stats.total_db_size_mb).toFixed(2)} MB` : "0.00 MB"}
                </span>
              </div>
            </div>
          </CardContent>
        </Link>
      </Card>

      {/* Enhanced Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-gradient-to-br from-background via-background to-primary/5 border-2 border-primary/20 text-foreground rounded-2xl shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 pointer-events-none rounded-2xl" />
          <AlertDialogHeader className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-red-500/20 to-red-400/10 rounded-lg border border-red-500/30">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-foreground to-red-500 bg-clip-text text-transparent">
                Delete Database Connection?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground/90 pl-14">
              Are you sure you want to delete <span className="font-semibold text-foreground">{name}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="relative z-10">
            <AlertDialogCancel className="bg-gradient-to-r from-background via-primary/5 to-background border-2 border-primary/30 text-foreground hover:border-primary/50 hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent rounded-xl transition-all duration-300">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 border border-red-400/30"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};