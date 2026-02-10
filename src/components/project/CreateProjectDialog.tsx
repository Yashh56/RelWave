import { useState } from "react";
import { Database, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatabaseConnection } from "@/types/database";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    databaseId: string;
    name: string;
    description?: string;
    defaultSchema?: string;
  }) => void;
  isLoading?: boolean;
  databases: DatabaseConnection[];
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  databases,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [databaseId, setDatabaseId] = useState("");
  const [defaultSchema, setDefaultSchema] = useState("");

  const resetForm = () => {
    setName("");
    setDescription("");
    setDatabaseId("");
    setDefaultSchema("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !databaseId) return;

    onSubmit({
      databaseId,
      name: name.trim(),
      description: description.trim() || undefined,
      defaultSchema: defaultSchema.trim() || undefined,
    });

    resetForm();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Create Project
          </DialogTitle>
          <DialogDescription>
            Create a project to save schema, ER diagrams, and queries offline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="My Project"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Linked Database */}
          <div className="space-y-2">
            <Label htmlFor="project-db">
              <span className="flex items-center gap-1.5">
                <LinkIcon className="h-3.5 w-3.5" />
                Linked Database
              </span>
            </Label>
            <Select value={databaseId} onValueChange={setDatabaseId}>
              <SelectTrigger id="project-db">
                <SelectValue placeholder="Select a database connection" />
              </SelectTrigger>
              <SelectContent>
                {databases.map((db) => (
                  <SelectItem key={db.id} value={db.id}>
                    <span className="flex items-center gap-2">
                      <Database className="h-3.5 w-3.5 text-muted-foreground" />
                      {db.name}
                      <span className="text-xs text-muted-foreground">
                        ({db.type})
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Default Schema */}
          <div className="space-y-2">
            <Label htmlFor="project-schema">Default Schema (optional)</Label>
            <Input
              id="project-schema"
              placeholder="public"
              value={defaultSchema}
              onChange={(e) => setDefaultSchema(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="project-desc">Description (optional)</Label>
            <Textarea
              id="project-desc"
              placeholder="Brief description of this project..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || !databaseId || isLoading}
            >
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
