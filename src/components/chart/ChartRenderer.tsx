import { BarChart3 } from 'lucide-react';
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

const COLORS = ["#06B6D4", "#A855F7", "#10B981", "#F59E0B", "#EF4444", "#52525B"];


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
            <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
                <BarChart3 className="h-10 w-10 mb-3" />
                <p className="text-lg font-semibold">Configure axes to generate chart</p>
                <p className="text-sm">Select both X and Y columns to plot your data.</p>
            </div>
        );
    }

    const isDarkMode = typeof document !== 'undefined' && document.body.classList.contains('dark');
    const rechartsTheme = {
        stroke: isDarkMode ? "#E5E7EB" : "#1F2937",
        gridStroke: isDarkMode ? "#374151" : "#E5E7EB",
        tooltipBg: isDarkMode ? "#1F2937" : "#FFFFFF",
        tooltipBorder: isDarkMode ? "#4B5563" : "#D1D5DB",
        lineStroke: COLORS[0],
    };

    const tooltipStyle = {
        backgroundColor: rechartsTheme.tooltipBg,
        border: `1px solid ${rechartsTheme.tooltipBorder}`,
        borderRadius: "8px",
        color: rechartsTheme.stroke,
    };

    const axisProps = {
        stroke: rechartsTheme.stroke,
        tick: { fill: rechartsTheme.stroke },
    };

    const yAxisLabel = yAxis ? `Count of ${yAxis}` : "Count";

    switch (chartType) {
        case "bar":
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={rechartsTheme.gridStroke} />
                        <XAxis dataKey="name" {...axisProps} />
                        <YAxis {...axisProps} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ color: rechartsTheme.stroke, paddingTop: '10px' }} />
                        <Bar dataKey="value" name={yAxisLabel}>
                            {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            );

        case "line":
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={rechartsTheme.gridStroke} />
                        <XAxis dataKey="name" {...axisProps} />
                        <YAxis {...axisProps} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ color: rechartsTheme.stroke, paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="value" stroke={rechartsTheme.lineStroke} strokeWidth={3} name={yAxisLabel} dot={{ fill: rechartsTheme.lineStroke, r: 4 }} activeDot={{ r: 6 }} />
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
                            label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                            outerRadius={120}
                            dataKey="value"
                        >
                            {chartData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={rechartsTheme.tooltipBg} strokeWidth={3} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ color: rechartsTheme.stroke, paddingTop: '10px' }} />
                    </PieChart>
                </ResponsiveContainer>
            );

        case "scatter":
            return (
                <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={rechartsTheme.gridStroke} />
                        <XAxis dataKey="name" name={xAxis} {...axisProps} />
                        <YAxis dataKey="value" name={yAxisLabel} {...axisProps} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ color: rechartsTheme.stroke, paddingTop: '10px' }} />
                        <Scatter name={yAxisLabel} data={chartData} fill={rechartsTheme.lineStroke} />
                    </ScatterChart>
                </ResponsiveContainer>
            );

        default:
            return null;
    }
};
