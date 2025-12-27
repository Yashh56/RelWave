import {StatsOverview} from './StatsOverview';
import { Database, Plus, Search, Sparkles } from 'lucide-react';
import { Input } from './ui/input';
import { DatabaseCard } from './DatabaseCard';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';
import { DatabaseConnection } from '@/types/database';

interface DashboardContentProps {
    databases: Array<DatabaseConnection>;
    connectedCount: number;
    totalTables: number | string;
    totalSize: string;
    totalRows: number;
    loading: boolean;
    statsLoading: boolean;
    searchQuery: string;
    status: Map<string, string>;
    setSearchQuery: (query: string) => void;
    handleDeleteDatabase: (id: string, name: string) => void;
    handleTestConnection: (id: string, name: string) => void;
    filteredDatabases: Array<DatabaseConnection>;
    setIsDialogOpen: (isOpen: boolean) => void;
}

const DashboardContent = ({
    databases,
    connectedCount,
    totalTables,
    totalSize,
    totalRows,
    loading,
    searchQuery,
    setSearchQuery,
    handleDeleteDatabase,
    handleTestConnection,
    filteredDatabases,
    setIsDialogOpen,
    status,
}: DashboardContentProps) => {
    return (
        <main className="grow overflow-y-auto">
            <div className="container mx-auto px-4 py-8">
                {/* Stats Overview */}
                <StatsOverview
                    databases={databases}
                    connectedCount={connectedCount}
                    totalTables={totalTables}
                    totalSize={totalSize}
                    totalRows={totalRows}
                    statsLoading={loading}
                />

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-full lg:max-w-xl group">
                        {/* Glow effect on focus */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                        
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <div className="p-1 rounded-lg bg-gradient-to-br from-primary/20 to-transparent border border-primary/30">
                                    <Search className="h-3.5 w-3.5 text-primary" />
                                </div>
                            </div>
                            <Input
                                placeholder="Search by connection name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-12 bg-gradient-to-r from-background via-primary/5 to-background border-2 border-primary/30 hover:border-primary/50 text-foreground focus:border-primary/50 transition-all duration-300 rounded-xl shadow-sm focus:shadow-lg focus:shadow-primary/10 placeholder:text-muted-foreground/60"
                            />
                        </div>
                    </div>
                </div>

                {/* Section Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-primary/30">
                        <Database className="h-5 w-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                        Active Connections
                    </h2>
                    {!loading && databases.length > 0 && (
                        <span className="px-3 py-1 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-full text-sm font-semibold text-primary">
                            {filteredDatabases.length} of {databases.length}
                        </span>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-xl" />
                        <div className="relative z-10">
                            <div className="relative mb-6">
                                <Spinner className="size-16 text-primary" />
                                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                            </div>
                            <p className="text-lg font-semibold text-foreground/90 mb-2">
                                Loading connections...
                            </p>
                            <p className="text-sm text-muted-foreground/70">Please wait while we fetch your databases</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Database Cards Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                            {filteredDatabases.map((db) => {
                                return (
                                    <DatabaseCard
                                        key={db.id}
                                        id={db.id}
                                        name={db.name}
                                        type={db.type}
                                        status={status}
                                        host={`${db.host}:${db.port}`}
                                        onDelete={() => handleDeleteDatabase(db.id, db.name)}
                                        onTest={() => handleTestConnection(db.id, db.name)}
                                    />
                                );
                            })}
                        </div>

                        {/* Empty State */}
                        {filteredDatabases.length === 0 && (
                            <div className="relative mt-8 rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 overflow-hidden">
                                {/* Animated background */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5 animate-pulse" />
                                
                                <div className="relative z-10 text-center py-24 px-6">
                                    <div className="relative inline-block mb-6">
                                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                        <div className="relative p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
                                            <Database className="h-16 w-16 text-primary/60" />
                                        </div>
                                    </div>
                                    
                                    <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                                        {databases.length === 0 ? 'No connections yet' : 'No matching connections found'}
                                    </h3>
                                    
                                    <p className="text-muted-foreground/80 mb-8 max-w-md mx-auto flex items-center justify-center gap-2">
                                        <Sparkles className="h-4 w-4 text-primary/60" />
                                        <span>
                                            {databases.length === 0
                                                ? 'Get started by adding your first database connection'
                                                : 'Try adjusting your search or create a new connection'}
                                        </span>
                                    </p>
                                    
                                    <Button
                                        onClick={() => setIsDialogOpen(true)}
                                        className="group relative bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary/90 text-white transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 rounded-xl border border-primary/30 hover:scale-105"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                                        <div className="relative flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            <span className="font-semibold">New Connection</span>
                                        </div>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
};

export default DashboardContent;