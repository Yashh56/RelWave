import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, ScatterChart as ScatterChartIcon, Sparkles, Database } from "lucide-react";
import { ColumnDetails } from '@/types/database';

interface ChartConfigPanelProps {
    chartType: "bar" | "line" | "pie" | "scatter";
    setChartType: (type: "bar" | "line" | "pie" | "scatter") => void;
    xAxis: string;
    setXAxis: (axis: string) => void;
    yAxis: string;
    setYAxis: (axis: string) => void;
    chartTitle: string;
    setChartTitle: (title: string) => void;
    columns: ColumnDetails[];
}

export const ChartConfigPanel: React.FC<ChartConfigPanelProps> = ({
    chartType,
    setChartType,
    xAxis,
    setXAxis,
    yAxis,
    setYAxis,
    chartTitle,
    setChartTitle,
    columns,
}) => {
    // Filter columns for X-axis (only primary keys)
    const xAxisColumns = useMemo(() =>
        columns.filter(col => !col.isPrimaryKey),
        [columns]
    );

    // Filter columns for Y-axis (exclude primary keys)
    const yAxisColumns = useMemo(() =>
        columns.filter(col => col.isPrimaryKey),
        [columns]
    );

    return (
        <div>
            <h4 className="text-xs font-medium text-muted-foreground/70 mb-3">Configuration</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Chart Type */}
                <div className="space-y-1.5">
                    <Label className="text-xs">Chart Type</Label>
                    <Select value={chartType} onValueChange={setChartType}>
                        <SelectTrigger className="h-9 text-sm">
                            <SelectValue placeholder="Choose" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="bar" className="text-sm">Bar Chart</SelectItem>
                            <SelectItem value="line" className="text-sm">Line Chart</SelectItem>
                            <SelectItem value="pie" className="text-sm">Pie Chart</SelectItem>
                            <SelectItem value="scatter" className="text-sm">Scatter Plot</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* X Axis - Only Primary Keys */}
                <div className="space-y-1.5">
                    <Label className="text-xs">X Axis (Non Primary Keys)</Label>
                    <Select value={xAxis} onValueChange={setXAxis}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Column" /></SelectTrigger>
                        <SelectContent>
                            {xAxisColumns.length > 0 ? (
                                xAxisColumns.map(col => (
                                    <SelectItem key={col.name} value={col.name} className="text-sm">{col.name}</SelectItem>
                                ))
                            ) : (
                                <SelectItem value="no-pk" disabled className="text-sm text-muted-foreground">
                                    No primary keys available
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Y Axis - Exclude Primary Keys */}
                <div className="space-y-1.5">
                    <Label className="text-xs">Y Axis (Primary Keys)</Label>
                    <Select value={yAxis} onValueChange={setYAxis}>
                        <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Column" /></SelectTrigger>
                        <SelectContent>
                            {yAxisColumns.length > 0 ? (
                                yAxisColumns.map(col => (
                                    <SelectItem key={col.name} value={col.name} className="text-sm">{col.name}</SelectItem>
                                ))
                            ) : (
                                <SelectItem value="no-data" disabled className="text-sm text-muted-foreground">
                                    No data columns available
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                    <Label className="text-xs">Chart Title</Label>
                    <Input
                        value={chartTitle}
                        onChange={(e) => setChartTitle(e.target.value)}
                        placeholder="Enter chart title"
                        className="h-9 text-sm"
                    />
                </div>
            </div>
        </div>
    );
};