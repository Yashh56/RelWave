import { useState } from "react";
import { useParams } from "react-router-dom";
import { RefreshCw, Download, FileText, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBridgeQuery } from "@/hooks/useBridgeQuery";
import { useDatabaseDetails } from "@/hooks/useDatabaseDetails";
import { useMigrations } from "@/hooks/useDbQueries";
import { useExport } from "@/hooks/useExport";
import BridgeLoader from "@/components/feedback/BridgeLoader";
import { Spinner } from "@/components/ui/spinner";
import VerticalIconBar from "@/components/common/VerticalIconBar";
import SlideOutPanel from "@/components/common/SlideOutPanel";
import TablesExplorerPanel from "@/components/database/TablesExplorerPanel";
import ContentViewerPanel from "@/components/database/ContentViewerPanel";
import ExpandableBottomPanel from "@/components/database/ExpandableBottomPanel";
import { MigrationsPanel } from "@/components/database";
import SqlEditor from "@/components/database/SqlEditor";
import { ChartVisualization } from "@/components/chart/ChartVisualization";

const DatabaseDetail = () => {
  const { id: dbId } = useParams<{ id: string }>();
  const { data: bridgeReady, isLoading: bridgeLoading } = useBridgeQuery();
  const [sqlExpanded, setSqlExpanded] = useState(false);
  const [migrationsOpen, setMigrationsOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);

  const {
    databaseName,
    tables,
    selectedTable,
    tableData,
    rowCount,
    totalRows,
    currentPage,
    pageSize,
    query,
    queryProgress,
    queryError,
    isExecuting,
    loading,
    loadingTables,
    error,
    setQuery,
    handleTableSelect,
    handleExecuteQuery,
    handleCancelQuery,
    fetchTables,
    handlePageChange,
    handlePageSizeChange,
  } = useDatabaseDetails({
    dbId,
    bridgeReady: bridgeReady ?? false,
  });

  // Export hook - exports all tables to CSV or JSON
  const { exportAllTables, isExporting } = useExport({
    dbId: dbId || "",
    databaseName: databaseName || "database",
  });

  // Fetch migrations data
  const { data: migrationsResponse } = useMigrations(dbId);
  const migrationsData = migrationsResponse?.migrations || {
    local: [],
    applied: [],
  };
  const baselined = migrationsResponse?.baselined || false;

  // Show loader during bridge loading or initial undefined state
  if (bridgeLoading || bridgeReady === undefined) {
    return <BridgeLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Card className="max-w-md w-full mx-4 border-border/20">
          <CardHeader className="border-b border-border/20">
            <CardTitle className="text-base">Connection Error</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground/70 mb-3">
              Failed to connect to the database:
            </p>
            <pre className="bg-muted/30 text-destructive p-3 rounded-md text-xs font-mono overflow-auto border border-border/20">
              {error}
            </pre>
            <div className="mt-4 flex gap-2">
              <Button size="sm" onClick={fetchTables} disabled={loadingTables} className="text-xs">
                {loadingTables ? (
                  <>
                    <Spinner className="h-3.5 w-3.5 mr-1.5" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Retry
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <VerticalIconBar dbId={dbId} />

      <main className="flex-1 ml-[60px] flex flex-col">
        {/* Header */}
        <header className="border-b border-border/20 bg-background/95 backdrop-blur-sm">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{databaseName || 'Database'}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tables.length} tables
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMigrationsOpen(true)}
                className="text-xs"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Migrations
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isExporting}
                    className="text-xs"
                  >
                    {isExporting ? (
                      <>
                        <Spinner className="h-3.5 w-3.5 mr-1.5" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Export All
                        <ChevronDown className="h-3 w-3 ml-1" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportAllTables("csv")}>
                    <FileText className="h-3.5 w-3.5 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportAllTables("json")}>
                    <FileText className="h-3.5 w-3.5 mr-2" />
                    Export as JSON
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                variant="outline"
                onClick={fetchTables}
                disabled={loadingTables}
                className="text-xs"
              >
                {loadingTables ? (
                  <Spinner className="h-3.5 w-3.5" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Split Screen Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Tables Explorer */}
          <TablesExplorerPanel
            dbId={dbId || ''}
            tables={tables}
            selectedTable={selectedTable}
            onSelectTable={handleTableSelect}
            loading={loadingTables}
          />

          {/* Right Panel: Content Viewer */}
          <ContentViewerPanel
            selectedTable={selectedTable?.name || null}
            tableData={tableData}
            totalRows={totalRows}
            currentPage={currentPage}
            pageSize={pageSize}
            onRefresh={fetchTables}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onChart={() => setChartOpen(true)}
          />
        </div>

        {/* Bottom Panel: SQL Workspace */}
        <ExpandableBottomPanel
          isExpanded={sqlExpanded}
          onToggle={() => setSqlExpanded(!sqlExpanded)}
          title="SQL Workspace"
        >
          <div className="h-full p-4 flex flex-col gap-2">
            <SqlEditor
              value={query}
              onChange={setQuery}
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {isExecuting && queryProgress && (
                  <span>Retrieved {queryProgress.rows.toLocaleString()} rows in {queryProgress.elapsed}s...</span>
                )}
                {queryError && (
                  <span className="text-destructive">{queryError}</span>
                )}
              </div>
              <div className="flex gap-2">
                {isExecuting ? (
                  <Button size="sm" variant="destructive" onClick={handleCancelQuery} className="text-xs">
                    Cancel
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleExecuteQuery} className="text-xs">
                    Execute
                  </Button>
                )}
              </div>
            </div>
          </div>
        </ExpandableBottomPanel>
      </main>

      {/* Right Slide-out: Migrations */}
      <SlideOutPanel
        isOpen={migrationsOpen}
        onClose={() => setMigrationsOpen(false)}
        title="Migrations"
        disableScroll={true}
      >
        <MigrationsPanel
          migrations={migrationsData}
          baselined={baselined}
          dbId={dbId || ""}
        />
      </SlideOutPanel>

      {/* Right Slide-out: Chart Visualization */}
      <SlideOutPanel
        isOpen={chartOpen}
        onClose={() => setChartOpen(false)}
        title="Chart Visualization"
        width="60%"
      >
        {selectedTable && (
          <div className="p-6">
            <ChartVisualization
              selectedTable={selectedTable}
              dbId={dbId}
            />
          </div>
        )}
      </SlideOutPanel>
    </div>
  );
};

export default DatabaseDetail;
