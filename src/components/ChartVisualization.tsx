import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, ScatterChart as ScatterChartIcon } from "lucide-react";
import { toPng, toSvg } from "html-to-image";
import { toast } from "sonner";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

interface ChartVisualizationProps {
  data: Array<Record<string, any>>;
}

export const ChartVisualization = ({ data }: ChartVisualizationProps) => {
  const [chartType, setChartType] = useState<"bar" | "line" | "pie" | "scatter">("bar");
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [chartTitle, setChartTitle] = useState("Query Results Visualization");

  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  const handleExport = async (format: "png" | "svg") => {
    const chartElement = document.getElementById("chart-container");
    if (!chartElement) return;

    try {
      const dataUrl = format === "png"
        ? await toPng(chartElement, { quality: 0.95, backgroundColor: "#ffffff" })
        : await toSvg(chartElement, { backgroundColor: "#ffffff" });

      const link = document.createElement("a");
      link.download = `chart-${Date.now()}.${format}`;
      link.href = dataUrl;
      link.click();

      toast.success(`Chart exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error("Failed to export chart");
    }
  };

  const renderChart = () => {
    if (!xAxis || !yAxis) {
      return (
        <div className="flex items-center justify-center h-[400px] text-muted-foreground">
          Select X and Y axes to generate chart
        </div>
      );
    }

    const chartData = data.map((row) => ({
      x: row[xAxis],
      y: Number(row[yAxis]) || 0,
    }));

    const commonProps = {
      width: 500,
      height: 400,
      data: chartData,
      margin: { top: 20, right: 30, left: 20, bottom: 20 },
    };

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="x" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="y" fill="hsl(var(--primary))" name={yAxis} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="x" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="y" stroke="hsl(var(--primary))" strokeWidth={2} name={yAxis} />
            </LineChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.x}
                outerRadius={120}
                fill="hsl(var(--primary))"
                dataKey="y"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="x" stroke="hsl(var(--foreground))" />
              <YAxis dataKey="y" stroke="hsl(var(--foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Scatter name={yAxis} data={chartData} fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="shadow-elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Chart Visualization</CardTitle>
            <CardDescription>Generate charts from your query results</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport("png")}>
              <Download className="h-4 w-4 mr-2" />
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport("svg")}>
              <Download className="h-4 w-4 mr-2" />
              SVG
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Chart Type</Label>
            <Select value={chartType} onValueChange={(val: any) => setChartType(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Bar Chart
                  </div>
                </SelectItem>
                <SelectItem value="line">
                  <div className="flex items-center gap-2">
                    <LineChartIcon className="h-4 w-4" />
                    Line Chart
                  </div>
                </SelectItem>
                <SelectItem value="pie">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4" />
                    Pie Chart
                  </div>
                </SelectItem>
                <SelectItem value="scatter">
                  <div className="flex items-center gap-2">
                    <ScatterChartIcon className="h-4 w-4" />
                    Scatter Plot
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>X Axis</Label>
            <Select value={xAxis} onValueChange={setXAxis}>
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Y Axis</Label>
            <Select value={yAxis} onValueChange={setYAxis}>
              <SelectTrigger>
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col} value={col}>
                    {col}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Chart Title</Label>
            <Input
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              placeholder="Enter title"
            />
          </div>
        </div>

        {/* Chart Display */}
        <div id="chart-container" className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-center mb-4">{chartTitle}</h3>
          {renderChart()}
        </div>
      </CardContent>
    </Card>
  );
};
