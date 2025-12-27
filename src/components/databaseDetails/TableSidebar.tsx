// src/components/databaseDetails/TableSelectorDropdown.tsx
import { Table2, Database, Sparkles } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Spinner } from "../ui/spinner";
import { SelectedTable, TableInfo } from "@/types/database";

interface TableSelectorDropdownProps {
    tables: TableInfo[];
    selectedTable: SelectedTable | null;
    loading: boolean;
    onTableSelect: (tableName: string, schemaName: string) => void;
}

const TableSelectorDropdown: React.FC<TableSelectorDropdownProps> = ({
    tables,
    selectedTable,
    loading,
    onTableSelect
}) => {
    // Group tables by schema for better organization in the dropdown
    const tablesBySchema = tables.reduce((acc, table) => {
        const schema = table.schema;
        if (!acc[schema]) {
            acc[schema] = [];
        }
        acc[schema].push(table);
        return acc;
    }, {} as Record<string, TableInfo[]>);

    const selectedValue = selectedTable
        ? `${selectedTable.schema}.${selectedTable.name}`
        : "";

    const handleValueChange = (value: string) => {
        if (value) {
            const [schemaName, tableName] = value.split('.');
            onTableSelect(tableName, schemaName);
        }
    };

    return (
        <div className="w-full sm:w-72">
            {loading ? (
                <div className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-transparent to-primary/10 backdrop-blur-sm">
                    <div className="relative">
                        <Spinner className="h-5 w-5 text-primary animate-spin" />
                        <div className="absolute inset-0 bg-primary/30 rounded-full blur-sm animate-pulse" />
                    </div>
                    <span className="text-sm font-medium text-foreground/80 animate-pulse">Loading tables...</span>
                </div>
            ) : (
                <Select value={selectedValue} onValueChange={handleValueChange} disabled={tables.length === 0}>
                    {/* Enhanced SelectTrigger with gradients and animations */}
                    <SelectTrigger
                        className="group relative w-full text-base font-mono bg-gradient-to-r from-background via-primary/5 to-background border-2 border-primary/30 hover:border-primary/50 transition-all duration-300 rounded-xl shadow-sm hover:shadow-lg hover:shadow-primary/20 backdrop-blur-sm overflow-hidden"
                    >
                        {/* Animated background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <div className="relative flex items-center gap-2 z-10">
                            {/* Icon container with gradient */}
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 group-hover:border-primary/50 transition-all duration-300 shadow-sm">
                                <Table2 className="h-4 w-4 text-primary" />
                            </div>
                            
                            <SelectValue placeholder="Select a Table..." className="truncate">
                                {selectedTable ? (
                                    <span className="flex items-center gap-2">
                                        <span className="font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                                            {selectedTable.name}
                                        </span>
                                        <span className="h-1 w-1 rounded-full bg-primary/50 animate-pulse" />
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        Select a Table...
                                        <Sparkles className="h-3 w-3 text-primary/40" />
                                    </span>
                                )}
                            </SelectValue>
                        </div>
                    </SelectTrigger>

                    {/* Enhanced Select Content with modern styling */}
                    <SelectContent className="max-h-[350px] bg-gradient-to-br from-popover via-popover to-primary/5 border-2 border-primary/20 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden">
                        {/* Decorative background elements */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="relative z-10">
                            {tables.length === 0 ? (
                                <SelectItem value="no-tables" disabled className="justify-center py-8">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <Database className="h-8 w-8 opacity-50" />
                                        <span className="text-sm font-medium">No tables found</span>
                                    </div>
                                </SelectItem>
                            ) : (
                                Object.entries(tablesBySchema).map(([schema, tables]) => (
                                    <SelectGroup key={schema} className="py-2">
                                        {/* Enhanced Schema Label */}
                                        <SelectLabel className="flex items-center gap-2 font-bold text-primary uppercase text-xs tracking-wider px-3 py-2 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-l-2 border-primary rounded-r-lg mb-1">
                                            <div className="h-2 w-2 rounded-full bg-primary/60 shadow-sm shadow-primary/50" />
                                            {schema}
                                            <Sparkles className="h-3 w-3 ml-auto text-primary/50" />
                                        </SelectLabel>
                                        
                                        {/* Table Items */}
                                        {tables.map((table) => (
                                            <SelectItem
                                                key={`${table.schema}.${table.name}`}
                                                value={`${table.schema}.${table.name}`}
                                                className="group font-mono mx-2 my-0.5 rounded-lg transition-all duration-300 focus:bg-gradient-to-r focus:from-primary/15 focus:via-primary/10 focus:to-transparent hover:bg-gradient-to-r hover:from-primary/10 hover:to-transparent border border-transparent hover:border-primary/20 focus:border-primary/30 hover:shadow-md hover:shadow-primary/10 cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between w-full py-1">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary group-focus:bg-primary transition-colors" />
                                                        <span className="font-semibold text-foreground/90 group-hover:text-foreground group-focus:text-primary transition-colors">
                                                            {table.name}
                                                        </span>
                                                    </div>
                                                    <span className="ml-3 text-xs font-medium text-muted-foreground/70 bg-muted/30 px-2 py-0.5 rounded-md group-hover:bg-primary/10 group-hover:text-primary/80 group-focus:bg-primary/15 group-focus:text-primary transition-all">
                                                        {table.type}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                ))
                            )}
                        </div>
                    </SelectContent>
                </Select>
            )}
        </div>
    );
};

export default TableSelectorDropdown;