import { useParams } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import {
  Node,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from "reactflow";
import "reactflow/dist/style.css";
import { toast } from "sonner";
import Header from "@/components/queryBuilder/Header";
import ControlPanel from "@/components/queryBuilder/ControlPanel";
import VisualBuilder from "@/components/queryBuilder/VisualBuilder";
import TableNode from "@/components/ERDiagram/TableNode";
import { isBridgeReady } from "@/services/bridgeClient";
import { bridgeApi } from "@/services/bridgeApi";
import { useBridgeQuery } from "@/hooks/useBridgeQuery";
import { Loader2 } from "lucide-react";
import { SchemaDetails } from "@/types/schema";
import { TableRow } from "@/types/database";

const nodeTypes = {
  table: TableNode,
};

const QueryBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [filters, setFilters] = useState<Array<{ column: string; operator: string; value: string }>>([]);
  const [sortBy, setSortBy] = useState("");
  const [groupBy, setGroupBy] = useState("");
  const [generatedSQL, setGeneratedSQL] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [schemaData, setSchemaData] = useState<SchemaDetails | null>(null);
  const [querySessionId, setQuerySessionId] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [queryProgress, setQueryProgress] = useState<any>(null);
  const [tableData, setTableData] = useState<TableRow[]>([]);

  const { data: bridgeReady, isLoading: bridgeLoading } = useBridgeQuery();


  useEffect(() => {
    if (!isBridgeReady || !id) return;

    const fetchSchema = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await bridgeApi.getSchema(id);
        if (result && result.schemas?.some(s => s.tables?.length)) {
          setSchemaData(result);
        } else {
          setError("Schema data found, but no tables to render.");
        }

        console.log("ER Diagram schema fetch result:", result?.schemas);
        console.log("Nodes after fetch:", schemaData);

      } catch (err: any) {
        console.error("ER Diagram fetch failed:", err);
        setError(err.message || "Failed to load schema for diagram.");
        toast.error("ER Diagram Load Failed", { description: err.message });
      } finally {
        setLoading(false);
      }
    };

    fetchSchema();
  }, [bridgeReady, id, setNodes, setEdges]);

  const addTable = useCallback(() => {
    if (!schemaData || !selectedTable) return;

    // Find the selected table from schemas
    const table = schemaData.schemas
      .flatMap(schema => schema.tables)
      .find(t => t.name === selectedTable);

    if (!table) {
      toast.error("Table not found in schema");
      return;
    }

    // Prevent duplicate table nodes
    const exists = nodes.some(
      node => node.type === "table" && node.data?.tableName === table.name
    );

    if (exists) {
      toast.warning(`${table.name} is already added`);
      return;
    }

    const newNode: Node = {
      id: `table-${table.name}`,
      type: "table",
      position: {
        x: Math.random() * 400 + 50,
        y: Math.random() * 300 + 50,
      },
      data: {
        label: table.name,
        tableName: table.name,
        columns: table.columns, // 👈 important
      },
    };

    setNodes(nds => [...nds, newNode]);
    toast.success(`Added ${table.name} table`);
  }, [schemaData, selectedTable, nodes, setNodes]);


  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      if (params.source === params.target) return;

      setEdges((eds) => {
        const exists = eds.some(
          (e) => e.source === params.source && e.target === params.target
        );

        if (exists) return eds;

        return addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "hsl(var(--primary))" },
          },
          eds
        );
      });
    },
    [setEdges]
  );

  const addFilter = useCallback(() => {
    setFilters((prev) => [...prev, { column: "", operator: "=", value: "" }]);
  }, [setFilters]);

  const removeFilter = useCallback(
    (index: number) => {
      setFilters((prev) => prev.filter((_, i) => i !== index));
    },
    [setFilters]
  );


  const generateSQL = useCallback(() => {
    if (!nodes.length) {
      toast.error("No tables selected");
      return;
    }

    const tables = nodes.map((n) => n.data.tableName);

    const joins = edges
      .map((e) => {
        const sourceNode = nodes.find((n) => n.id === e.source);
        const targetNode = nodes.find((n) => n.id === e.target);

        if (!sourceNode || !targetNode) return null;

        return `INNER JOIN ${targetNode.data.tableName}
ON ${sourceNode.data.tableName}.id = ${targetNode.data.tableName}.${sourceNode.data.tableName}_id`;
      })
      .filter(Boolean)
      .join("\n");

    const whereClause = filters
      .filter((f) => f.column && f.value)
      .map((f) => `${f.column} ${f.operator} '${f.value}'`)
      .join(" AND ");

    let sql = `SELECT *\nFROM ${tables[0]}`;

    if (joins) sql += `\n${joins}`;
    if (whereClause) sql += `\nWHERE ${whereClause}`;
    if (groupBy) sql += `\nGROUP BY ${groupBy}`;
    if (sortBy) sql += `\nORDER BY ${sortBy}`;

    sql += ";";

    setGeneratedSQL(sql);
    toast.success("SQL query generated");
  }, [nodes, edges, filters, groupBy, sortBy]);




  const executeQuery = async () => {
    if (!id) {
      toast.error("Database ID is missing");
      return;
    }
    if (!generatedSQL) {
      toast.error("No SQL query to execute");
      return;
    }
    try {
      if (querySessionId) {
        toast.warning("Query already running", { description: "Cancelling previous query first." });
        await handleCancelQuery();
      }

      // Reset state
      setTableData([]);
      setRowCount(0);
      setQueryProgress(null);
      setIsExecuting(true);

      const sessionId = await bridgeApi.createSession()
      setQuerySessionId(sessionId);
      toast.info("Executing query...", { description: "Query started, receiving results..." });
      await bridgeApi.runQuery({
        sessionId,
        dbId: id,
        sql: generatedSQL,
      });

    } catch (error) {
      console.error("Error executing query:", error);
      toast.error("Query execution failed", { description: (error as Error).message });
    }
  };


  const handleCancelQuery = async () => {
    if (!querySessionId) return;

    try {
      const cancelled = await bridgeApi.cancelSession(querySessionId);
      if (cancelled) {
        toast.info("Cancelling query...", { description: "Stopping query execution" });
      }
    } catch (error: any) {
      console.error("Error cancelling query:", error);
      toast.error("Failed to cancel query", { description: error.message });
    }
  };

  useEffect(() => {
    const handleResult = (event: CustomEvent) => {
      if (event.detail.sessionId !== querySessionId) return;
      setTableData(prev => [...prev, ...event.detail.rows]);
      setRowCount(prev => prev + event.detail.rows.length);
    };

    const handleProgress = (event: CustomEvent) => {
      if (event.detail.sessionId !== querySessionId) return;
      setQueryProgress({
        rows: event.detail.rowsSoFar,
        elapsed: Math.round(event.detail.elapsedMs / 1000)
      });
    };

    const handleDone = (event: CustomEvent) => {
      if (event.detail.sessionId !== querySessionId) return;

      setIsExecuting(false);
      setQuerySessionId(null);
      setQueryProgress(null);

      const { rows, timeMs, status } = event.detail;
      const statusType = status === 'success' ? 'success' : 'warning';
      const message = status === 'success'
        ? `Retrieved ${rows.toLocaleString()} rows in ${(timeMs / 1000).toFixed(2)}s`
        : `Stopped after retrieving ${rows.toLocaleString()} rows.`;

      toast[statusType](statusType === 'success' ? "Query Complete" : "Query Cancelled", { description: message });
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
      { name: 'bridge:query.progress', handler: handleProgress },
      { name: 'bridge:query.done', handler: handleDone },
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


  if (loading || bridgeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-10 h-10 mr-2 animate-spin text-primary" />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <Header id={id || "database"} />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          {schemaData && !loading && !bridgeLoading && (
            <ControlPanel
              selectedTable={selectedTable}
              setSelectedTable={setSelectedTable}
              addTable={addTable}
              filters={filters}
              setFilters={setFilters}
              sortBy={sortBy}
              setSortBy={setSortBy}
              groupBy={groupBy}
              setGroupBy={setGroupBy}
              Tables={schemaData}
              addFilter={addFilter}
              removeFilter={removeFilter}
              generateSQL={generateSQL}
            />
          )}
          {/* Middle Panel - Visual Builder */}
          {schemaData && !loading && !bridgeLoading && (
            <VisualBuilder
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              generatedSQL={generatedSQL}
              executeQuery={executeQuery}
              queryResults={tableData}
              nodeTypes={nodeTypes}
              isExecuting={isExecuting}
              rowCount={rowCount}
              queryProgress={queryProgress}
            />)}
        </div>
      </div>
    </div>
  );
};

export default QueryBuilder;
