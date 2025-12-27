import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, Sparkles } from "lucide-react";

interface DataTableProps {
  data: Array<Record<string, any>>;
}

export const DataTable = ({ data }: DataTableProps) => {
  const tableContainerClass = "rounded-2xl border border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 shadow-2xl backdrop-blur-sm relative overflow-hidden";

  const tableHeaderClass = "sticky top-0 bg-gradient-to-r from-primary/10 via-primary/5 to-background backdrop-blur-md border-b border-primary/20 z-10";

  const emptyStateClass = "flex flex-col items-center justify-center h-64 rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 text-muted-foreground p-8 relative overflow-hidden";

  if (!data || data.length === 0) {
    return (
      <div className={emptyStateClass}>
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5 animate-pulse" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative mb-4">
            <Info className="h-12 w-12 text-primary/60" />
            <Sparkles className="h-5 w-5 text-primary/40 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <p className="text-xl font-bold text-foreground/90 mb-2 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            No Data Available
          </p>
          <p className="text-sm text-muted-foreground/80">The query returned an empty result set.</p>
        </div>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <ScrollArea className={`h-[400px] w-full ${tableContainerClass}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      <div className="relative w-full overflow-auto">
        <Table className="w-full">
          <TableHeader className={tableHeaderClass}>
            <TableRow className="hover:bg-transparent border-none">
              {columns.map((column, idx) => (
                <TableHead
                  key={column}
                  className="font-bold text-foreground uppercase text-xs tracking-widest min-w-[120px] p-4 transition-all duration-300 hover:text-primary hover:scale-105"
                  style={{
                    animationDelay: `${idx * 50}ms`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/50" />
                    {column}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow
                key={index}
                className={`border-primary/10 transition-all duration-300 group
                  ${index % 2 === 0 ? 'bg-transparent' : 'bg-primary/5'} 
                  hover:bg-gradient-to-r hover:from-primary/10 hover:via-primary/5 hover:to-transparent 
                  hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 hover:scale-[1.01]`}
              >
                {columns.map((column, colIdx) => (
                  <TableCell 
                    key={column} 
                    className="font-mono text-sm text-foreground/90 whitespace-nowrap p-4 transition-all duration-300 group-hover:text-foreground"
                    style={{
                      animationDelay: `${colIdx * 30}ms`,
                    }}
                  >
                    {row[column]?.toString() || (
                      <span className="text-muted-foreground/60 italic font-sans text-xs px-2 py-0.5 bg-muted/30 rounded">
                        NULL
                      </span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ScrollArea>
  );
};