import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Loader2, Play, RefreshCw, X, Code2, Sparkles, Zap, Clock } from 'lucide-react'
import { Textarea } from '../ui/textarea'
import { DataTable } from '../DataTable'
import { QueryProgress } from '@/types/database'
import { TableRow } from '@/types/database'

interface EditorProps {
    isExecuting: boolean;
    rowCount: number;
    query: string;
    accentButtonClass: string;
    accentClass: string;
    tableData: TableRow[];
    queryProgress: QueryProgress | null;
    setQuery: (q: string) => void;
    onExecuteQuery: () => void;
    onCancelQuery: () => void;
}

const Editor = ({
    isExecuting,
    rowCount,
    query,
    queryProgress,
    tableData,
    setQuery,
    onExecuteQuery,
    onCancelQuery,
}: EditorProps) => {
    return (
        <>
            {/* SQL Query Editor Card */}
            <Card className="bg-gradient-to-br from-background via-background to-primary/5 border-2 border-primary/20 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-sm">
                {/* Animated background gradients */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 opacity-50 animate-pulse pointer-events-none" />
                
                {/* Decorative corner accents */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/20 to-transparent rounded-tr-full blur-2xl" />
                
                <CardHeader className="border-b border-primary/20 pb-6 relative z-10 bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-primary/30">
                                <Code2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                                    SQL Query Editor
                                </CardTitle>
                                <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1">
                                    <Sparkles className="h-3 w-3 text-primary/60" />
                                    Write and execute your queries
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {isExecuting && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={onCancelQuery}
                                    className="group relative bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-300 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 rounded-xl border border-red-400/30 hover:scale-105"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                                    <div className="relative flex items-center gap-2">
                                        <X className="h-4 w-4" />
                                        <span className="font-semibold">Cancel</span>
                                    </div>
                                </Button>
                            )}
                            <Button
                                onClick={onExecuteQuery}
                                disabled={isExecuting || !query.trim()}
                                className="group relative bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary/90 text-white transition-all duration-300 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl border border-primary/30 hover:scale-105"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                                <div className="relative flex items-center gap-2">
                                    {isExecuting ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            <span className="font-semibold">Executing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Play className="h-4 w-4" />
                                            <span className="font-semibold">Execute Query</span>
                                        </>
                                    )}
                                </div>
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="space-y-4 pt-6 relative z-10">
                    <div className="relative group">
                        {/* Glow effect on focus */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                        
                        <Textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            disabled={isExecuting}
                            className="relative font-mono text-sm min-h-[250px] resize-y 
                                     bg-gradient-to-br from-muted/50 via-background to-muted/30 
                                     border-2 border-primary/20 text-foreground 
                                     focus:border-primary/50 focus:bg-gradient-to-br focus:from-primary/5 focus:to-accent/5
                                     transition-all duration-300 placeholder:text-muted-foreground/60 p-4
                                     disabled:opacity-80 disabled:cursor-not-allowed rounded-xl
                                     shadow-inner hover:shadow-lg hover:shadow-primary/5"
                            placeholder="-- Enter your SQL query here
SELECT * FROM users WHERE role = 'Admin';

-- Press Execute to run your query"
                        />
                        
                        {/* Character counter/status indicator */}
                        <div className="absolute bottom-3 right-3 flex items-center gap-2 text-xs text-muted-foreground/60 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-primary/10">
                            <Code2 className="h-3 w-3" />
                            <span>{query.length} chars</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Query Results Section */}
            <Card className="bg-gradient-to-br from-background via-background to-primary/5 border-2 border-primary/20 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-sm">
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 opacity-50 animate-pulse pointer-events-none" />
                
                {/* Decorative corner accents */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/20 to-transparent rounded-tr-full blur-2xl" />
                
                <CardHeader className="border-b border-primary/20 pb-6 relative z-10 bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-primary/30">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                                    Query Results
                                </CardTitle>
                                <CardDescription className="text-muted-foreground/80 flex items-center gap-3 mt-1">
                                    {isExecuting ? (
                                        <>
                                            <div className="flex items-center gap-2">
                                                <RefreshCw className="h-3 w-3 animate-spin text-primary" />
                                                <span className="animate-pulse font-medium">Fetching results...</span>
                                            </div>
                                            <span className="text-primary font-semibold">
                                                ({rowCount.toLocaleString()} rows)
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-3 w-3 text-primary/60" />
                                            <span className="font-semibold">
                                                {rowCount.toLocaleString()}
                                            </span>
                                            <span>rows retrieved</span>
                                        </>
                                    )}
                                    {queryProgress && (
                                        <span className="flex items-center gap-1.5 ml-2 text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
                                            <Clock className="h-3 w-3" />
                                            {queryProgress.elapsed}s
                                        </span>
                                    )}
                                </CardDescription>
                            </div>
                        </div>
                        
                        {/* Status indicator */}
                        <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${isExecuting ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-500'} shadow-lg ${isExecuting ? 'shadow-yellow-500/50' : 'shadow-emerald-500/50'}`} />
                            <span className="text-xs font-medium text-muted-foreground">
                                {isExecuting ? 'Processing' : 'Complete'}
                            </span>
                        </div>
                    </div>
                </CardHeader>
                
                <CardContent className="pt-6 relative z-10">
                    {isExecuting && rowCount === 0 ? (
                        <div className="text-center py-24 text-muted-foreground relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-xl" />
                            <div className="relative z-10">
                                <div className="relative inline-block mb-6">
                                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                                </div>
                                <p className="text-lg font-semibold text-foreground/90 mb-2">
                                    Awaiting first results batch...
                                </p>
                                <p className="text-sm text-muted-foreground/70">Your query is being processed</p>
                            </div>
                        </div>
                    ) : (
                        <DataTable data={tableData} />
                    )}
                </CardContent>
            </Card>
        </>
    )
}

export default Editor