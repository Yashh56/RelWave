import { Link } from "react-router-dom";
import { Database, Table2, HardDrive, Activity, Trash2, TestTube, MoreVertical } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface DatabaseCardProps {
  id: string;
  name: string;
  type: string;
  status: "connected" | "disconnected";
  tables: number;
  size: string;
  host: string;
  onDelete?: () => void;
  onTest?: () => void;
}

export const DatabaseCard = ({
  id,
  name,
  type,
  status,
  tables,
  size,
  host,
  onDelete,
  onTest
}: DatabaseCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Dynamic colors based on status
  const isConnected = status === "connected";
  // The badge background and border are kept static as they are color indicators, not theme indicators.
  const statusColorClass = isConnected
    ? "bg-emerald-600/20 text-emerald-600 border-emerald-500/50 dark:text-emerald-300"
    : "bg-red-600/20 text-red-600 border-red-500/50 dark:text-red-300";

  const iconColor = isConnected ? "text-cyan-600 dark:text-cyan-400" : "text-red-600 dark:text-red-400";
  const hoverGlow = isConnected ? "hover:border-cyan-500/80" : "hover:border-red-500/80";

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleTest = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onTest?.();
  };

  const confirmDelete = () => {
    setShowDeleteDialog(false);
    onDelete?.();
  };

  return (
    <>
      <Card
        // Main Card: Light: bg-white border-gray-300, Dark: bg-gray-900/70 border-primary/20
        // Hover: Light: hover:bg-gray-50, Dark: hover:bg-gray-800/80
        className={`bg-white dark:bg-gray-900/70 border border-gray-300 dark:border-primary/20 rounded-xl shadow-md dark:shadow-2xl 
                   transition-all duration-300 cursor-pointer h-full 
                   group ${hoverGlow} hover:bg-gray-50 dark:hover:bg-gray-800/80 relative`}
      >
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            {/* Database Info - Clickable Link */}
            <Link to={`/${id}`} className="flex items-center gap-3 min-w-0 flex-1 pr-1">
              <div
                // Icon BG: Light: bg-cyan/red-600/10, Dark: bg-cyan/red-600/30
                className={`p-3 rounded-xl transition-colors flex-shrink-0 
                  ${isConnected ? "bg-cyan-600/10 dark:bg-cyan-600/30" : "bg-red-600/10 dark:bg-red-600/30"}`}
              >
                <Database className={`h-6 w-6 ${iconColor}`} />
              </div>

              <div className="truncate min-w-0 flex-1">
                <CardTitle
                  // Title: Light: text-gray-900, Dark: text-white. Hover: text-cyan-600/400
                  className="text-xl mb-1 text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate"
                >
                  {name}
                </CardTitle>
                <CardDescription
                  // Description: Light: text-gray-500, Dark: text-gray-500 (stays gray)
                  className="font-mono text-xs text-gray-500 truncate"
                >
                  {
                    host.length > 30 && host != 'localhost' ? `${host.slice(0, 15)}...${host.slice(-15)}` : host
                  }
                </CardDescription>
              </div>
            </Link>

            {/* Actions Menu and Badge - fixed size, flex-shrink-0 */}
            <div className="flex items-center gap-1 flex-shrink-0 ml-1">
              <Badge
                variant="outline"
                className={`hidden sm:flex items-center gap-1 font-semibold uppercase px-3 py-1 ${statusColorClass}`}
              >
                <Activity className={`h-3 w-3 mr-1 ${isConnected ? "animate-pulse" : ""}`} />
                {status}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    // Menu Button: Light: text-gray-600 hover:text-black hover:bg-gray-100, Dark: text-gray-400 hover:text-white hover:bg-gray-800
                    className="h-8 w-8 text-gray-600 hover:text-black hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  // Dropdown Content: Light: bg-white border-gray-300, Dark: bg-gray-900 border-gray-700
                  className="bg-white border-gray-300 text-black dark:bg-gray-900 dark:border-gray-700 dark:text-white shadow-lg"
                >
                  <DropdownMenuItem
                    onClick={handleTest}
                    // Dropdown Item Hover: Light: hover:bg-gray-100, Dark: hover:bg-gray-800
                    className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                  >
                    <TestTube className="h-4 w-4 mr-2 text-cyan-600 dark:text-cyan-400" />
                    Test Connection
                  </DropdownMenuItem>
                  {/* Separator: Light: bg-gray-200, Dark: bg-gray-700 */}
                  <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                  <DropdownMenuItem
                    onClick={handleDelete}
                    // Delete Item: Light/Dark: text-red-600/400
                    className="cursor-pointer text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 focus:bg-red-50 dark:focus:bg-red-900/20"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Connection
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>

        <Link to={`/${id}`}>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-4 pt-2">

              {/* Database Type */}
              <div
                // Border: Light: border-gray-200, Dark: border-gray-800
                className="flex items-center justify-between text-sm border-b border-gray-200 dark:border-gray-800 pb-2"
              >
                {/* Label: Light: text-gray-600, Dark: text-gray-400 */}
                <span className="text-gray-600 dark:text-gray-400">Database Engine</span>
                <span
                  // Badge: Light: text-black bg-gray-100, Dark: text-white bg-gray-800/70
                  className="font-mono font-medium text-black dark:text-white px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800/70 truncate max-w-[50%]"
                >
                  {type}
                </span>
              </div>

              {/* Tables Count */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2 flex-shrink-0">
                  <Table2 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  Total Tables
                </span>
                <span className="font-mono font-medium text-lg text-black dark:text-white">
                  <span className="text-right inline-block">{tables}</span>
                </span>
              </div>

              {/* Size */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2 flex-shrink-0">
                  <HardDrive className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  Storage Used
                </span>
                <span className="font-mono font-medium text-lg text-black dark:text-white">
                  <span className="text-right inline-block">{size}</span>
                </span>
              </div>

            </div>
          </CardContent>
        </Link>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        {/* Alert Content: Light: bg-white border-gray-300, Dark: bg-gray-900 border-gray-700 */}
        <AlertDialogContent className="bg-white border-gray-300 text-black dark:bg-gray-900 dark:border-gray-700 dark:text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-black dark:text-white">
              Delete Database Connection?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
              Are you sure you want to delete <span className="font-semibold text-black dark:text-white">{name}</span>?
              This action cannot be undone. The connection configuration will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              // Cancel Button: Light: bg-gray-100 border-gray-300 text-gray-700, Dark: bg-gray-800 border-gray-700 text-gray-300
              className="bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};