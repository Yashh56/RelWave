import { useState } from "react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Table } from "lucide-react";
import TableDesignerForm from "./TableDesignerForm";
import { CreateTableColumn } from "@/types/database";
import { bridgeApi } from "@/services/bridgeApi";

interface CreateTableDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dbId: string;
    schemaName: string;
    onSuccess?: () => void;
}

export default function CreateTableDialog({
    open,
    onOpenChange,
    dbId,
    schemaName,
    onSuccess,
}: CreateTableDialogProps) {
    const [tableName, setTableName] = useState("");
    const [columns, setColumns] = useState<CreateTableColumn[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setTableName("");
        setColumns([]);
    };

    const handleClose = () => {
        if (!isSubmitting) {
            resetForm();
            onOpenChange(false);
        }
    };

    const validateForm = (): boolean => {
        if (!tableName.trim()) {
            toast.error("Table name is required");
            return false;
        }

        if (columns.length === 0) {
            toast.error("At least one column is required");
            return false;
        }

        // Check for empty column names
        const emptyNames = columns.filter((col) => !col.name.trim());
        if (emptyNames.length > 0) {
            toast.error("All columns must have a name");
            return false;
        }

        // Check for duplicate column names
        const names = columns.map((col) => col.name.toLowerCase());
        const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
        if (duplicates.length > 0) {
            toast.error(`Duplicate column name: ${duplicates[0]}`);
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            await bridgeApi.createTable({
                dbId,
                schemaName,
                tableName: tableName.trim(),
                columns: columns.map((col) => ({
                    ...col,
                    name: col.name.trim(),
                    default_value: col.default_value?.trim() || undefined,
                })),
            });

            toast.success("Table created successfully", {
                description: `Table "${tableName}" has been created in schema "${schemaName}".`,
            });

            resetForm();
            onOpenChange(false);

            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error("Failed to create table:", error);
            toast.error("Failed to create table", {
                description: error.message || "An unknown error occurred",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Table className="h-5 w-5" />
                        Create New Table
                    </DialogTitle>
                    <DialogDescription>
                        Create a new table in schema <span className="font-mono font-medium">{schemaName}</span>
                    </DialogDescription>
                </DialogHeader>

                <TableDesignerForm
                    tableName={tableName}
                    onTableNameChange={setTableName}
                    columns={columns}
                    onColumnsChange={setColumns}
                />

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            "Create Table"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
