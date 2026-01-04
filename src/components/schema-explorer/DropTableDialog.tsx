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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";
import { DropMode } from "@/types/database";
import { bridgeApi } from "@/services/bridgeApi";

interface DropTableDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    dbId: string;
    schemaName: string;
    tableName: string;
    onSuccess?: () => void;
}

export default function DropTableDialog({
    open,
    onOpenChange,
    dbId,
    schemaName,
    tableName,
    onSuccess,
}: DropTableDialogProps) {
    const [mode, setMode] = useState<DropMode>("RESTRICT");
    const [confirmText, setConfirmText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const resetForm = () => {
        setMode("RESTRICT");
        setConfirmText("");
    };

    const handleClose = () => {
        if (!isSubmitting) {
            resetForm();
            onOpenChange(false);
        }
    };

    const handleSubmit = async () => {
        // Validate confirmation
        if (confirmText !== tableName) {
            toast.error("Table name doesn't match", {
                description: `Please type "${tableName}" to confirm deletion.`,
            });
            return;
        }

        setIsSubmitting(true);

        try {
            // Generate migration instead of dropping table directly
            const result = await bridgeApi.generateDropMigration({
                dbId,
                schemaName,
                tableName,
                mode,
            });

            toast.success("Migration created successfully!", {
                description: `Created migration file: ${result.filename}. Review and apply it in the Migrations panel.`,
            });

            resetForm();
            onOpenChange(false);

            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error("Failed to create migration:", error);
            toast.error("Failed to create migration", {
                description: error.message || "An unknown error occurred",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Generate Drop Table Migration
                    </DialogTitle>
                    <DialogDescription>
                        This will create a migration to drop table{" "}
                        <span className="font-mono font-medium">{tableName}</span> from schema{" "}
                        <span className="font-mono font-medium">{schemaName}</span>.
                        The migration can be reviewed before applying.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Drop Mode Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="drop-mode" className="text-sm font-medium">
                            Drop Mode
                        </Label>
                        <Select value={mode} onValueChange={(value) => setMode(value as DropMode)}>
                            <SelectTrigger id="drop-mode">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="RESTRICT">
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">RESTRICT</span>
                                        <span className="text-xs text-muted-foreground">
                                            Fail if foreign keys reference this table
                                        </span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="DETACH_FKS">
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium">DETACH FKs</span>
                                        <span className="text-xs text-muted-foreground">
                                            Drop dependent foreign keys first
                                        </span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="CASCADE">
                                    <div className="flex flex-col items-start">
                                        <span className="font-medium text-destructive">CASCADE</span>
                                        <span className="text-xs text-muted-foreground">
                                            Drop all dependent objects (dangerous!)
                                        </span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Confirmation Input */}
                    <div className="space-y-2">
                        <Label htmlFor="confirm-input" className="text-sm font-medium">
                            Type table name to confirm
                        </Label>
                        <Input
                            id="confirm-input"
                            placeholder={tableName}
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="font-mono"
                        />
                    </div>

                    {/* Warning Box */}
                    <div className="border border-destructive/50 bg-destructive/5 rounded-lg p-4">
                        <p className="text-sm text-destructive">
                            <strong>⚠️ Warning:</strong> Dropping a table is irreversible once the migration is applied.
                            {mode === "CASCADE" && " CASCADE mode will also drop all dependent objects!"}
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={isSubmitting || confirmText !== tableName}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            "Generate Migration"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
