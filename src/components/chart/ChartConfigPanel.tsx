import React from 'react';
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
}) => (
    <div className="relative p-6 bg-gradient-to-br from-background via-primary/5 to-accent/5 border-2 border-primary/20 rounded-2xl shadow-xl backdrop-blur-sm">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-primary/20">
            <div className="p-1.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg border border-primary/30">
                <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-foreground/90 uppercase tracking-wider">
                Chart Configuration
            </h3>
        </div>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            {/* Chart Type Select */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-primary/60" />
                    Chart Type
                </Label>
                <Select value={chartType} onValueChange={(val: any) => setChartType(val)}>
                    <SelectTrigger className="group relative bg-gradient-to-r from-background via-primary/5 to-background border-2 border-primary/30 hover:border-primary/50 text-foreground focus:border-primary/50 transition-all duration-300 rounded-xl shadow-sm hover:shadow-lg hover:shadow-primary/10">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                        <SelectValue className="relative z-10" />
                    </SelectTrigger>
                    <SelectContent className="bg-gradient-to-br from-popover via-popover to-primary/5 border-2 border-primary/20 rounded-xl shadow-2xl backdrop-blur-xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none rounded-xl" />
                        <div className="relative z-10 space-y-1 p-1">
                            <SelectItem 
                                value="bar"
                                className="rounded-lg hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-transparent border border-transparent hover:border-cyan-500/20 transition-all duration-300"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1 bg-cyan-500/10 rounded border border-cyan-500/20">
                                        <BarChart3 className="h-3.5 w-3.5 text-cyan-400" />
                                    </div>
                                    <span className="font-medium">Bar Chart</span>
                                </div>
                            </SelectItem>
                            <SelectItem 
                                value="line"
                                className="rounded-lg hover:bg-gradient-to-r hover:from-violet-500/10 hover:to-transparent border border-transparent hover:border-violet-500/20 transition-all duration-300"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1 bg-violet-500/10 rounded border border-violet-500/20">
                                        <LineChartIcon className="h-3.5 w-3.5 text-violet-400" />
                                    </div>
                                    <span className="font-medium">Line Chart</span>
                                </div>
                            </SelectItem>
                            <SelectItem 
                                value="pie"
                                className="rounded-lg hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-transparent border border-transparent hover:border-emerald-500/20 transition-all duration-300"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1 bg-emerald-500/10 rounded border border-emerald-500/20">
                                        <PieChartIcon className="h-3.5 w-3.5 text-emerald-400" />
                                    </div>
                                    <span className="font-medium">Pie Chart</span>
                                </div>
                            </SelectItem>
                            <SelectItem 
                                value="scatter"
                                className="rounded-lg hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-transparent border border-transparent hover:border-amber-500/20 transition-all duration-300"
                            >
                                <div className="flex items-center gap-2.5">
                                    <div className="p-1 bg-amber-500/10 rounded border border-amber-500/20">
                                        <ScatterChartIcon className="h-3.5 w-3.5 text-amber-400" />
                                    </div>
                                    <span className="font-medium">Scatter Plot</span>
                                </div>
                            </SelectItem>
                        </div>
                    </SelectContent>
                </Select>
            </div>

            {/* X Axis Select */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-primary/60" />
                    X Axis
                </Label>
                <Select value={xAxis} onValueChange={setXAxis}>
                    <SelectTrigger className="group relative bg-gradient-to-r from-background via-primary/5 to-background border-2 border-primary/30 hover:border-primary/50 text-foreground focus:border-primary/50 transition-all duration-300 rounded-xl shadow-sm hover:shadow-lg hover:shadow-primary/10">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                        <SelectValue placeholder="Select column" className="relative z-10" />
                    </SelectTrigger>
                    {columns.length > 0 && (
                        <SelectContent className="bg-gradient-to-br from-popover via-popover to-primary/5 border-2 border-primary/20 rounded-xl shadow-2xl backdrop-blur-xl max-h-[250px]">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none rounded-xl" />
                            <div className="relative z-10 space-y-0.5 p-1">
                                {columns.map((col) => (
                                    <SelectItem 
                                        key={col.name} 
                                        value={col.name}
                                        className="rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent border border-transparent hover:border-primary/20 transition-all duration-300 font-mono"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                            {col.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </div>
                        </SelectContent>
                    )}
                </Select>
            </div>

            {/* Y Axis Select */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-primary/60" />
                    Y Axis
                </Label>
                <Select value={yAxis} onValueChange={setYAxis}>
                    <SelectTrigger className="group relative bg-gradient-to-r from-background via-primary/5 to-background border-2 border-primary/30 hover:border-primary/50 text-foreground focus:border-primary/50 transition-all duration-300 rounded-xl shadow-sm hover:shadow-lg hover:shadow-primary/10">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
                        <SelectValue placeholder="Select column" className="relative z-10" />
                    </SelectTrigger>
                    {columns.length > 0 && (
                        <SelectContent className="bg-gradient-to-br from-popover via-popover to-primary/5 border-2 border-primary/20 rounded-xl shadow-2xl backdrop-blur-xl max-h-[250px]">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none rounded-xl" />
                            <div className="relative z-10 space-y-0.5 p-1">
                                {columns.map((col) => (
                                    <SelectItem 
                                        key={col.name} 
                                        value={col.name}
                                        className="rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent border border-transparent hover:border-primary/20 transition-all duration-300 font-mono"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                            {col.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </div>
                        </SelectContent>
                    )}
                </Select>
            </div>

            {/* Chart Title Input */}
            <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <div className="h-1 w-1 rounded-full bg-primary/60" />
                    Chart Title
                </Label>
                <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                    <Input
                        value={chartTitle}
                        onChange={(e) => setChartTitle(e.target.value)}
                        placeholder="Enter title"
                        className="relative bg-gradient-to-r from-background via-primary/5 to-background border-2 border-primary/30 hover:border-primary/50 text-foreground focus:border-primary/50 transition-all duration-300 rounded-xl shadow-sm focus:shadow-lg focus:shadow-primary/10"
                    />
                </div>
            </div>
        </div>
    </div>
);