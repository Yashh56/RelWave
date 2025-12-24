import { BarChart3, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
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

// Enhanced color palette with vibrant gradients
const COLORS = [
    "#06B6D4", // Cyan
    "#A855F7", // Purple
    "#10B981", // Emerald
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#3B82F6", // Blue
    "#EC4899", // Pink
    "#8B5CF6"  // Violet
];

interface DataProps {
    count: number | string;
    [key: string]: any;
}

interface ChartRendererProps {
    chartType: "bar" | "line" | "pie" | "scatter";
    xAxis: string;
    yAxis: string;
    data: DataProps[];
}

export const ChartRenderer = ({
    chartType,
    xAxis,
    yAxis,
    data,
}: ChartRendererProps) => {
    const chartData = useMemo(() => {
        if (!data || !Array.isArray(data) || !xAxis) {
            return [];
        }

        return data.map((item) => {
            const xVal = item[xAxis];
            const countVal = item.count || item.COUNT || item.Count;

            let numValue = 0;
            if (countVal !== undefined && countVal !== null && countVal !== '') {
                const parsed = parseFloat(String(countVal));
                numValue = isNaN(parsed) ? 0 : parsed;
            }

            return {
                name: xVal != null ? String(xVal) : 'N/A',
                value: numValue,
            };
        });
    }, [data, xAxis]);

    if (!xAxis || chartData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-xl" />
                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                        <div className="relative p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/20">
                            <BarChart3 className="h-12 w-12 text-primary" />
                        </div>
                    </div>
                    <p className="text-xl font-bold text-foreground/90 mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                        Configure Axes to Generate Chart
                    </p>
                    <p className="text-sm text-muted-foreground/70 flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-primary/60" />
                        Select both X and Y columns to visualize your data
                    </p>
                </div>
            </div>
        );
    }

    const isDarkMode = typeof document !== 'undefined' && document.body.classList.contains('dark');
    
    // Enhanced theme with better contrast and modern colors
    const rechartsTheme = {
        stroke: isDarkMode ? "#F3F4F6" : "#1F2937",
        gridStroke: isDarkMode ? "#374151" : "#E5E7EB",
        tooltipBg: isDarkMode ? "#1F2937" : "#FFFFFF",
        tooltipBorder: isDarkMode ? "#06B6D4" : "#06B6D4",
        lineStroke: COLORS[0],
    };

    const tooltipStyle = {
        backgroundColor: rechartsTheme.tooltipBg,
        border: `2px solid ${rechartsTheme.tooltipBorder}`,
        borderRadius: "12px",
        padding: "12px",
        color: rechartsTheme.stroke,
        boxShadow: isDarkMode 
            ? "0 10px 40px rgba(6, 182, 212, 0.2)" 
            : "0 10px 40px rgba(6, 182, 212, 0.15)",
    };

    const axisProps = {
        stroke: rechartsTheme.stroke,
        tick: { fill: rechartsTheme.stroke, fontSize: 12 },
        style: { fontWeight: 500 },
    };

    const yAxisLabel = yAxis ? `Count of ${yAxis}` : "Count";

    switch (chartType) {
        case "bar":
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <defs>
                            {COLORS.map((color, index) => (
                                <linearGradient key={`gradient-${index}`} id={`barGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                                    <stop offset="100%" stopColor={color} stopOpacity={0.6} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={rechartsTheme.gridStroke} opacity={0.5} />
                        <XAxis dataKey="name" {...axisProps} />
                        <YAxis {...axisProps} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(6, 182, 212, 0.1)' }} />
                        <Legend 
                            wrapperStyle={{ 
                                color: rechartsTheme.stroke, 
                                paddingTop: '20px',
                                fontWeight: 600 
                            }} 
                        />
                        <Bar dataKey="value" name={yAxisLabel} radius={[8, 8, 0, 0]}>
                            {chartData.map((_, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={`url(#barGradient-${index % COLORS.length})`}
                                    strokeWidth={0}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            );

        case "line":
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <defs>
                            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={rechartsTheme.lineStroke} stopOpacity={0.3} />
                                <stop offset="100%" stopColor={rechartsTheme.lineStroke} stopOpacity={0.05} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={rechartsTheme.gridStroke} opacity={0.5} />
                        <XAxis dataKey="name" {...axisProps} />
                        <YAxis {...axisProps} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: rechartsTheme.lineStroke, strokeWidth: 2 }} />
                        <Legend 
                            wrapperStyle={{ 
                                color: rechartsTheme.stroke, 
                                paddingTop: '20px',
                                fontWeight: 600 
                            }} 
                        />
                        <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={rechartsTheme.lineStroke} 
                            strokeWidth={3} 
                            name={yAxisLabel} 
                            dot={{ 
                                fill: rechartsTheme.lineStroke, 
                                r: 5,
                                strokeWidth: 2,
                                stroke: isDarkMode ? "#1F2937" : "#FFFFFF"
                            }} 
                            activeDot={{ 
                                r: 8, 
                                fill: rechartsTheme.lineStroke,
                                stroke: isDarkMode ? "#1F2937" : "#FFFFFF",
                                strokeWidth: 3
                            }}
                            fill="url(#lineGradient)"
                        />
                    </LineChart>
                </ResponsiveContainer>
            );

        case "pie":
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                        <defs>
                            {COLORS.map((color, index) => (
                                <linearGradient key={`pieGradient-${index}`} id={`pieGradient-${index}`} x1="0" y1="0" x2="1" y2="1">
                                    <stop offset="0%" stopColor={color} stopOpacity={0.9} />
                                    <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                                </linearGradient>
                            ))}
                        </defs>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={{
                                stroke: rechartsTheme.stroke,
                                strokeWidth: 1.5
                            }}
                            label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                            outerRadius={130}
                            innerRadius={40}
                            dataKey="value"
                            paddingAngle={2}
                        >
                            {chartData.map((_, index) => (
                                <Cell 
                                    key={`cell-${index}`} 
                                    fill={`url(#pieGradient-${index % COLORS.length})`}
                                    stroke={rechartsTheme.tooltipBg} 
                                    strokeWidth={3}
                                />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend 
                            wrapperStyle={{ 
                                color: rechartsTheme.stroke, 
                                paddingTop: '20px',
                                fontWeight: 600 
                            }} 
                        />
                    </PieChart>
                </ResponsiveContainer>
            );

        case "scatter":
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={rechartsTheme.gridStroke} opacity={0.5} />
                        <XAxis dataKey="name" name={xAxis} {...axisProps} />
                        <YAxis dataKey="value" name={yAxisLabel} {...axisProps} />
                        <Tooltip 
                            cursor={{ strokeDasharray: '3 3', stroke: rechartsTheme.lineStroke }} 
                            contentStyle={tooltipStyle} 
                        />
                        <Legend 
                            wrapperStyle={{ 
                                color: rechartsTheme.stroke, 
                                paddingTop: '20px',
                                fontWeight: 600 
                            }} 
                        />
                        <Scatter 
                            name={yAxisLabel} 
                            data={chartData} 
                            fill={rechartsTheme.lineStroke}
                            shape={(props: any) => {
                                const { cx, cy } = props;
                                return (
                                    <g>
                                        <circle 
                                            cx={cx} 
                                            cy={cy} 
                                            r={6} 
                                            fill={rechartsTheme.lineStroke}
                                            opacity={0.8}
                                        />
                                        <circle 
                                            cx={cx} 
                                            cy={cy} 
                                            r={3} 
                                            fill={isDarkMode ? "#1F2937" : "#FFFFFF"}
                                        />
                                    </g>
                                );
                            }}
                        />
                    </ScatterChart>
                </ResponsiveContainer>
            );

        default:
            return null;
    }
};