import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Loader2, BarChart3, Sparkles, ImageIcon, FileCode } from "lucide-react";
import { toPng, toSvg } from "html-to-image";
import { toast } from "sonner";
import { ChartConfigPanel } from "./chart/ChartConfigPanel";
import { ChartRenderer } from "./chart/ChartRenderer";
import { ColumnDetails, SelectedTable } from "@/types/database";
import { bridgeApi } from "@/services/bridgeApi";



interface ChartVisualizationProps {
  selectedTable: SelectedTable;
  dbId?: string;
}

interface QueryResultRow {
  count: string;
}

interface QueryResultColumn {
  name: string
}

export interface QueryResultEventDetail {
  sessionId: string;
  batchIndex: number;
  rows: QueryResultRow[];
  columns: QueryResultColumn[];
  completed: boolean;
}

export const ChartVisualization = ({ selectedTable, dbId }: ChartVisualizationProps) => {

  const [chartType, setChartType] = useState<"bar" | "line" | "pie" | "scatter">("bar");
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [chartTitle, setChartTitle] = useState("Query Results Visualization");
  const [columnData, setColumnData] = useState<ColumnDetails[]>([]);
  const [schemaData, setSchemaData] = useState<QueryResultEventDetail | null>(null);
  const [rowData, setRowData] = useState<QueryResultRow[]>([]);
  const [querySessionId, setQuerySessionId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [queryProgress, setQueryProgress] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  const handleExport = async (format: "png" | "svg") => {
    const chartElement = document.getElementById("chart-container");
    if (!chartElement) return;

    try {
      // Determine background based on current theme (simple detection based on dark class presence)
      const isDarkMode = chartElement.closest('.dark');
      const backgroundColor = isDarkMode ? "#050505" : "#FFFFFF"; // Use app background

      const dataUrl = format === "png"
        ? await toPng(chartElement, { quality: 0.95, backgroundColor })
        : await toSvg(chartElement, { backgroundColor });

      const link = document.createElement("a");
      link.download = `chart-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();

      toast.success(`Chart exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export chart");
      setErrorMessage("Failed to export chart");
    }
  };

  useEffect(() => {
    async function getTables() {
      if (dbId) {
        try {
          const result = await bridgeApi.getSchema(dbId);
          const schemas = result?.schemas

          schemas?.map((schema) => {
            if (schema.name === selectedTable.schema) {
              schema.tables.map((table) => {
                if (table.name === selectedTable.name) {
                  setColumnData(table.columns);
                }
              })
            }
          });
        } catch (error) {
          toast.error("Failed to fetch table schema");
          setErrorMessage("Failed to fetch table schema");
        }
      }
    }


    getTables();
  }, [selectedTable, dbId]);

  useEffect(() => {

    async function getData() {
      try {
        if (!dbId) return;

        const generatedQuery = `SELECT "${xAxis}", COUNT("${yAxis}") as count 
                         FROM "${selectedTable?.schema}"."${selectedTable?.name}" 
                         GROUP BY "${xAxis}" 
                         ORDER BY count DESC;`;


        if (xAxis === "" || yAxis === "") return;
        const sessionId = await bridgeApi.createSession(dbId);
        setQuerySessionId(sessionId);
        await bridgeApi.runQuery({
          sessionId: sessionId,
          sql: generatedQuery,
          batchSize: 1000,
          dbId: dbId,
        });
        setIsExecuting(true);
      } catch (error) {
        toast.error("Failed to execute query");
        setErrorMessage("Failed to execute query");
      } finally {
        setIsExecuting(false);
      }
    }

    getData();
  }, [xAxis, yAxis]);

  useEffect(() => {
    const handleResult = (event: CustomEvent) => {
      if (event.detail.sessionId !== querySessionId) return;
      setSchemaData(event.detail);
      setRowData((prev: QueryResultRow[]) => [...prev, ...event.detail.rows]);
    };

    const handleError = (event: CustomEvent) => {
      if (event.detail.sessionId !== querySessionId) return;

      setIsExecuting(false);
      setQuerySessionId(null);
      setQueryProgress(null);
      toast.error("Query failed", { description: event.detail.error?.message || "An error occurred" });
    };

    const eventListeners = [
      { name: 'bridge:query.result', handler: handleResult },
      { name: 'bridge:query.error', handler: handleError },
    ];

    eventListeners.forEach(listener => {
      window.addEventListener(listener.name, listener.handler as EventListener);
    });

    return () => {
      eventListeners.forEach(listener => {
        window.removeEventListener(listener.name, listener.handler as EventListener);
      });
    };
  }, [querySessionId]);


  return (
    <Card className="bg-gradient-to-br from-background via-background to-primary/5 border-2 border-primary/20 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-sm">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10 opacity-50 animate-pulse pointer-events-none" />
      
      {/* Decorative corner accents */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/20 to-transparent rounded-tr-full blur-2xl" />
      
      <CardHeader className="border-b border-primary/20 pb-6 relative z-10 bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-primary/30">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                Chart Visualization
              </CardTitle>
              <CardDescription className="text-muted-foreground/80 flex items-center gap-2 mt-1">
                <Sparkles className="h-3 w-3 text-primary/60" />
                <span>Generate interactive charts from your data</span>
              </CardDescription>
            </div>
          </div>
          
          {/* Export Buttons */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport("png")} 
              className="group relative border-2 border-primary/30 text-foreground hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent hover:border-primary/50 transition-all duration-300 rounded-xl shadow-sm hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 group-hover:border-primary/40 transition-all duration-300">
                  <ImageIcon className="h-3 w-3" />
                </div>
                <span className="font-medium">Export PNG</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleExport("svg")} 
              className="group relative border-2 border-primary/30 text-foreground hover:text-primary hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent hover:border-primary/50 transition-all duration-300 rounded-xl shadow-sm hover:shadow-lg hover:shadow-primary/20 hover:scale-105"
            >
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 group-hover:border-primary/40 transition-all duration-300">
                  <FileCode className="h-3 w-3" />
                </div>
                <span className="font-medium">Export SVG</span>
              </div>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6 relative z-10">
        {/* Configuration Panel */}
        <div className="relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 rounded-2xl blur opacity-50" />
          <div className="relative">
            <ChartConfigPanel
              chartType={chartType}
              setChartType={setChartType}
              xAxis={xAxis}
              setXAxis={setXAxis}
              yAxis={yAxis}
              setYAxis={setYAxis}
              chartTitle={chartTitle}
              setChartTitle={setChartTitle}
              columns={columnData}
            />
          </div>
        </div>

        {/* Chart Display Area */}
        <div 
          id="chart-container" 
          className="relative bg-gradient-to-br from-background via-background/95 to-primary/5 border-2 border-primary/20 rounded-2xl p-8 shadow-2xl min-h-[450px] overflow-hidden"
        >
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            {/* Chart Title */}
            <div className="flex items-center justify-center gap-3 mb-6 pb-4 border-b border-primary/20">
              <div className="h-2 w-2 rounded-full bg-primary/60 shadow-lg shadow-primary/50 animate-pulse" />
              <h3 className="text-xl font-bold text-center bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                {chartTitle}
              </h3>
              <div className="h-2 w-2 rounded-full bg-primary/60 shadow-lg shadow-primary/50 animate-pulse" />
            </div>
            
            {/* Chart Content */}
            {isExecuting ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                </div>
                <p className="text-lg font-semibold text-foreground/90 mb-2">
                  Generating visualization...
                </p>
                <p className="text-sm text-muted-foreground/70">Please wait while we process your data</p>
              </div>
            ) : (
              <div className="relative">
                <ChartRenderer
                  chartType={chartType}
                  xAxis={xAxis}
                  yAxis={yAxis}
                  data={rowData}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};