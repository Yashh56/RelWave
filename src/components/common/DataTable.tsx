import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Info } from "lucide-react";

interface DataTableProps {
  data: Array<Record<string, any>>;
  maxHeight?: string;
}

export const DataTable = ({ data, maxHeight = "500px" }: DataTableProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground">
        <Info className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm font-medium">No Data Available</p>
        <p className="text-xs text-muted-foreground">The query returned an empty result set.</p>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <ScrollArea className="w-full" style={{ maxHeight }}>
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column}
                  className="font-medium text-xs uppercase tracking-wide text-muted-foreground whitespace-nowrap px-4 py-3"
                >
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow
                key={index}
                className="hover:bg-muted/50"
              >
                {columns.map((column) => (
                  <TableCell
                    key={column}
                    className="font-mono text-sm whitespace-nowrap px-4 py-2.5"
                    title={row[column]?.toString() || 'NULL'}
                  >
                    {row[column] !== null && row[column] !== undefined ? (
                      formatCellValue(row[column])
                    ) : (
                      <span className="text-muted-foreground/60 italic text-xs">NULL</span>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  );
};

// Helper function to format cell values
function formatCellValue(value: any): React.ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground/60 italic text-xs">NULL</span>;
  }

  if (typeof value === 'boolean') {
    return (
      <span className={value ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
        {value.toString()}
      </span>
    );
  }

  if (typeof value === 'number') {
    return <span className="text-blue-600 dark:text-blue-400">{value.toLocaleString()}</span>;
  }

  if (value instanceof Date) {
    return value.toLocaleString();
  }

  if (typeof value === 'object') {
    try {
      return (
        <span className="text-amber-600 dark:text-amber-400 text-xs">
          {JSON.stringify(value).slice(0, 100)}
          {JSON.stringify(value).length > 100 ? '...' : ''}
        </span>
      );
    } catch {
      return '[Object]';
    }
  }

  const strValue = String(value);
  if (strValue.length > 100) {
    return strValue.slice(0, 100) + '...';
  }

  return strValue;
}