import { DatabaseConnection } from '@/types/database'
import { Card, CardContent } from './ui/card'
import { Database, Activity, Table2, HardDrive, Layers } from 'lucide-react'

export interface StatsOverviewProps {
    databases: Array<DatabaseConnection>
    connectedCount: number
    totalTables: number | string
    totalSize: string
    totalRows: number
    statsLoading: boolean
}

const StatsOverview = ({ databases, connectedCount, totalTables, totalSize, statsLoading, totalRows }: StatsOverviewProps) => {
    const stats = [
        {
            id: 'total-connections',
            icon: Database,
            value: databases.length,
            label: 'Total Connections',
            color: 'cyan',
            gradient: 'from-cyan-500/20 to-cyan-400/10',
            borderColor: 'hover:border-cyan-500/50',
            iconBg: 'bg-gradient-to-br from-cyan-500/20 to-cyan-400/10',
            iconBorder: 'border-cyan-500/30',
            iconColor: 'text-cyan-400',
            shadowColor: 'hover:shadow-cyan-500/20',
            glowColor: 'cyan',
        },
        {
            id: 'active-connections',
            icon: Activity,
            value: connectedCount,
            label: 'Active Connections',
            color: 'emerald',
            gradient: 'from-emerald-500/20 to-emerald-400/10',
            borderColor: 'hover:border-emerald-500/50',
            iconBg: 'bg-gradient-to-br from-emerald-500/20 to-emerald-400/10',
            iconBorder: 'border-emerald-500/30',
            iconColor: 'text-emerald-400',
            shadowColor: 'hover:shadow-emerald-500/20',
            glowColor: 'emerald',
        },
        {
            id: 'total-tables',
            icon: Table2,
            value: statsLoading ? "..." : totalTables,
            label: 'Total Schemas/Tables',
            color: 'violet',
            gradient: 'from-violet-500/20 to-violet-400/10',
            borderColor: 'hover:border-violet-500/50',
            iconBg: 'bg-gradient-to-br from-violet-500/20 to-violet-400/10',
            iconBorder: 'border-violet-500/30',
            iconColor: 'text-violet-400',
            shadowColor: 'hover:shadow-violet-500/20',
            glowColor: 'violet',
        },
        {
            id: 'total-rows',
            icon: Layers,
            value: statsLoading ? "..." : totalRows.toLocaleString(),
            label: 'Total Rows',
            color: 'purple',
            gradient: 'from-purple-500/20 to-purple-400/10',
            borderColor: 'hover:border-purple-500/50',
            iconBg: 'bg-gradient-to-br from-purple-500/20 to-purple-400/10',
            iconBorder: 'border-purple-500/30',
            iconColor: 'text-purple-400',
            shadowColor: 'hover:shadow-purple-500/20',
            glowColor: 'purple',
        },
        {
            id: 'total-size',
            icon: HardDrive,
            value: statsLoading ? "..." : totalSize,
            label: 'Total Data Size',
            color: 'amber',
            gradient: 'from-amber-500/20 to-amber-400/10',
            borderColor: 'hover:border-amber-500/50',
            iconBg: 'bg-gradient-to-br from-amber-500/20 to-amber-400/10',
            iconBorder: 'border-amber-500/30',
            iconColor: 'text-amber-400',
            shadowColor: 'hover:shadow-amber-500/20',
            glowColor: 'amber',
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
            {stats.map((stat) => (
                <Card 
                    key={stat.id}
                    className={`group relative bg-gradient-to-br from-background via-background to-${stat.color}-500/5 border-2 border-primary/20 ${stat.borderColor} rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl ${stat.shadowColor} hover:scale-105 overflow-hidden`}
                >
                    {/* Animated background gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-tr ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                    
                    {/* Decorative corner accent */}
                    <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-${stat.color}-500/20 to-transparent rounded-bl-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />
                    
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center gap-4">
                            {/* Icon Container with Glow Effect */}
                            <div className="relative group/icon">
                                {/* Glow effect */}
                                <div className={`absolute inset-0 bg-${stat.color}-500/30 rounded-xl blur-md group-hover:blur-lg transition-all duration-300 opacity-50`} />
                                <div className={`relative p-3 ${stat.iconBg} rounded-xl border ${stat.iconBorder} transition-all duration-300 group-hover:scale-110`}>
                                    <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                                </div>
                            </div>
                            
                            {/* Stats Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <p className={`text-3xl font-extrabold bg-gradient-to-r from-foreground to-${stat.color}-400 bg-clip-text text-transparent transition-all duration-300`}>
                                        {stat.value}
                                    </p>
                                    {statsLoading && stat.id !== 'total-connections' && stat.id !== 'active-connections' && (
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                                    )}
                                </div>
                                <p className="text-xs font-medium text-muted-foreground/80 leading-tight">
                                    {stat.label}
                                </p>
                            </div>
                        </div>
                        
                        {/* Bottom accent line */}
                        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-${stat.color}-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}

export { StatsOverview };