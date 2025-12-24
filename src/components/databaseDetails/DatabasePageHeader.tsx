import { Link } from "react-router-dom";
import { Button } from "../ui/button";
import { ArrowLeft, GitBranch, Layers, RefreshCw, Download, Settings, Server, Sparkles } from "lucide-react";
import { Spinner } from "../ui/spinner";

interface DatabasePageHeaderProps {
    dbId: string;
    databaseName: string;
    onRefresh: () => void;
    onBackup: () => void;
    loading?: boolean;
}

const DatabasePageHeader: React.FC<DatabasePageHeaderProps> = ({
    dbId,
    databaseName,
    onRefresh,
    onBackup,
    loading = false
}) => (
    <header className="border-b-2 border-primary/20 bg-gradient-to-r from-background via-primary/5 to-background backdrop-blur-xl sticky top-0 z-50 shadow-2xl relative overflow-hidden">
        {/* Animated background gradients */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-50" />
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-primary/10 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-full bg-gradient-to-r from-accent/10 to-transparent blur-3xl" />
        
        <div className="container mx-auto px-4 py-3 flex items-center justify-between h-16 relative z-10">

            {/* Left Section: Back Button & Database Name/Status */}
            <div className="flex items-center gap-3">
                <Link to="/">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent hover:text-primary transition-all duration-300 rounded-xl border border-transparent hover:border-primary/30 hover:shadow-lg hover:shadow-primary/20"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>

                {/* Database Title Block */}
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/50 rounded-xl blur-md group-hover:blur-lg transition-all duration-300 opacity-75" />
                        <div className="relative p-2.5 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-xl shadow-lg shadow-primary/30 border border-primary/30">
                            <Server className="h-5 w-5 text-white" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                                {databaseName}
                            </h1>
                            {loading && (
                                <div className="relative">
                                    <Spinner className="h-4 w-4 text-primary animate-spin" />
                                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-sm animate-pulse" />
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                            <span className="relative inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-gradient-to-r from-emerald-100/80 to-emerald-50/50 dark:from-emerald-900/50 dark:to-emerald-900/30 px-3 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm">
                                <span className="relative flex h-2 w-2 mr-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-lg shadow-emerald-500/50"></span>
                                </span>
                                Connected
                                <Sparkles className="h-3 w-3 ml-1.5 text-emerald-500/70" />
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Section: Navigation Links & Actions */}
            <div className="flex items-center gap-4">

                {/* Primary Navigation Links */}
                <nav className="hidden md:flex items-center gap-2">
                    {[
                        { path: `/database/${dbId}/query-builder`, icon: GitBranch, label: "Data & Query" },
                        { path: `/database/${dbId}/schema-explorer`, icon: Layers, label: "Schema Explorer" },
                        { path: `/database/${dbId}/er-diagram`, icon: Settings, label: "ER Diagram" },
                    ].map(({ path, icon: Icon, label }) => (
                        <Link key={path} to={path}>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="group relative text-muted-foreground hover:text-primary transition-all duration-300 rounded-xl border border-transparent hover:border-primary/30 hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent hover:shadow-lg hover:shadow-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="p-1 rounded-lg bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 group-hover:border-primary/40 transition-all duration-300">
                                        <Icon className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="font-medium">{label}</span>
                                </div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent group-hover:w-full transition-all duration-300" />
                            </Button>
                        </Link>
                    ))}
                </nav>

                {/* Vertical Separator with gradient */}
                <div className="h-8 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent hidden md:block" />

                {/* Utility Actions */}
                <div className="flex items-center gap-2">
                    {/* Backup Button */}
                    <Button
                        size="sm"
                        onClick={onBackup}
                        disabled={loading}
                        className="group relative bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary/90 text-white transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-primary/30 hover:scale-105"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                        <div className="relative flex items-center gap-2">
                            <Download className="h-4 w-4" />
                            <span className="font-semibold">Backup</span>
                        </div>
                    </Button>

                    {/* Refresh Button */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={loading}
                        className="group relative border-2 border-primary/30 text-foreground hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent hover:border-primary/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
                    >
                        <div className="relative">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            {loading && (
                                <div className="absolute inset-0 bg-primary/30 rounded-full blur-sm animate-pulse" />
                            )}
                        </div>
                    </Button>
                </div>
            </div>
        </div>
    </header>
);

export default DatabasePageHeader;