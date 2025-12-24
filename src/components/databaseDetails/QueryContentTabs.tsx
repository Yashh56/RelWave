import { FC } from "react";
import { QueryProgress, SelectedTable } from "@/types/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardDescription, CardTitle } from "../ui/card";
import { Table2, Code, BarChart, Sparkles } from "lucide-react";
import { ChartVisualization } from "../ChartVisualization";
import Data from "./Data";
import Editor from "./Editor";
import { TableRow } from "@/types/database";


interface QueryContentTabsProps {
    dbId?: string;
    selectedTable: SelectedTable | null;
    isExecuting: boolean;
    tableData: TableRow[];
    rowCount: number;
    query: string;
    queryProgress: QueryProgress | null;
    setQuery: (q: string) => void;
    onExecuteQuery: () => void;
    onCancelQuery: () => void;
}

const QueryContentTabs: FC<QueryContentTabsProps> = ({
    dbId,
    selectedTable,
    isExecuting,
    tableData,
    rowCount,
    query,
    queryProgress,
    setQuery,
    onExecuteQuery,
    onCancelQuery,
}) => {

    const accentClass = "text-primary dark:text-primary";
    const accentBorderClass = "border-primary dark:border-primary";
    const accentButtonClass = "bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/30";


    return (
        <div className="w-full relative">
            {/* Background decorative elements */}
            <div className="absolute -top-20 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 left-0 w-48 h-48 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl pointer-events-none" />
            
            <Tabs defaultValue="data" className="w-full relative z-10">
                {/* Enhanced Tabs Header with glassmorphism effect */}
                <header className="relative mb-6 pb-1 rounded-2xl bg-gradient-to-r from-background via-primary/5 to-background border-b-2 border-primary/20 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-t-2xl" />
                    
                    <TabsList className="bg-transparent dark:bg-transparent border-none rounded-none p-0 h-auto space-x-1 relative z-10 px-4 pt-2">
                        {/* Data Tab */}
                        <TabsTrigger 
                            value="data" 
                            className="group relative px-6 py-3 data-[state=active]:shadow-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary text-muted-foreground hover:text-primary transition-all duration-300 border-b-3 border-transparent data-[state=active]:border-primary rounded-t-xl font-semibold hover:bg-primary/5"
                        >
                            <div className="flex items-center gap-2 relative z-10">
                                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 group-data-[state=active]:border-primary/40 transition-all duration-300">
                                    <Table2 className="h-4 w-4" />
                                </div>
                                <span>Current Table Data</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-primary/50 group-data-[state=active]:bg-primary animate-pulse" />
                            </div>
                            {/* Active indicator glow */}
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent group-data-[state=active]:w-full transition-all duration-300 shadow-lg shadow-primary/50" />
                        </TabsTrigger>

                        {/* Editor Tab */}
                        <TabsTrigger 
                            value="editor" 
                            className="group relative px-6 py-3 data-[state=active]:shadow-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary text-muted-foreground hover:text-primary transition-all duration-300 border-b-3 border-transparent data-[state=active]:border-primary rounded-t-xl font-semibold hover:bg-primary/5"
                        >
                            <div className="flex items-center gap-2 relative z-10">
                                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 group-data-[state=active]:border-primary/40 transition-all duration-300">
                                    <Code className="h-4 w-4" />
                                </div>
                                <span>Query Editor</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-primary/50 group-data-[state=active]:bg-primary animate-pulse" />
                            </div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent group-data-[state=active]:w-full transition-all duration-300 shadow-lg shadow-primary/50" />
                        </TabsTrigger>

                        {/* Charts Tab */}
                        <TabsTrigger 
                            value="charts" 
                            className="group relative px-6 py-3 data-[state=active]:shadow-none data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/10 data-[state=active]:to-primary/5 data-[state=active]:text-primary text-muted-foreground hover:text-primary transition-all duration-300 border-b-3 border-transparent data-[state=active]:border-primary rounded-t-xl font-semibold hover:bg-primary/5"
                        >
                            <div className="flex items-center gap-2 relative z-10">
                                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 group-data-[state=active]:border-primary/40 transition-all duration-300">
                                    <BarChart className="h-4 w-4" />
                                </div>
                                <span>Charts</span>
                                <div className="h-1.5 w-1.5 rounded-full bg-primary/50 group-data-[state=active]:bg-primary animate-pulse" />
                            </div>
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent group-data-[state=active]:w-full transition-all duration-300 shadow-lg shadow-primary/50" />
                        </TabsTrigger>
                    </TabsList>
                </header>

                {/* Tab Contents with fade-in animations */}
                <TabsContent value="data" className="space-y-4 animate-in fade-in-50 duration-500">
                    <Data
                        selectedTable={selectedTable}
                        isExecuting={isExecuting}
                        tableData={tableData}
                        rowCount={rowCount}
                    />
                </TabsContent>

                <TabsContent value="editor" className="space-y-6 animate-in fade-in-50 duration-500">
                    <Editor
                        isExecuting={isExecuting}
                        rowCount={rowCount}
                        query={query}
                        queryProgress={queryProgress}
                        accentButtonClass={accentButtonClass}
                        accentClass={accentClass}
                        tableData={tableData}
                        setQuery={setQuery}
                        onExecuteQuery={onExecuteQuery}
                        onCancelQuery={onCancelQuery}
                    />
                </TabsContent>

                <TabsContent value="charts" className="space-y-4 animate-in fade-in-50 duration-500">
                    <Card className="bg-gradient-to-br from-background via-background to-primary/5 border-2 border-primary/20 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-sm">
                        {/* Animated background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 opacity-50 animate-pulse pointer-events-none" />
                        
                        {/* Decorative corner accents */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full blur-2xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/20 to-transparent rounded-tr-full blur-2xl" />
                        
                        <div className="relative z-10 p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-primary/30">
                                    <BarChart className="h-5 w-5 text-primary" />
                                </div>
                                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                                    Data Visualizations
                                </CardTitle>
                            </div>
                            
                            <CardDescription className="text-muted-foreground/80 mb-6 flex items-center gap-2 ml-14">
                                <Sparkles className="h-3 w-3 text-primary/60" />
                                <span>Explore your data with interactive charts</span>
                            </CardDescription>
                            
                            {selectedTable ? (
                                <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 p-4">
                                    <ChartVisualization
                                        selectedTable={selectedTable}
                                        dbId={dbId}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-primary/10">
                                    <div className="relative mb-4">
                                        <BarChart className="h-12 w-12 text-primary/60" />
                                        <Sparkles className="h-5 w-5 text-primary/40 absolute -top-1 -right-1 animate-pulse" />
                                    </div>
                                    <p className="text-lg font-semibold text-foreground/90 mb-2">No Table Selected</p>
                                    <p className="text-sm text-muted-foreground/70">Select a table to visualize its data</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default QueryContentTabs;