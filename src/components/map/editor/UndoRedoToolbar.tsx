"use client";

import { Undo2, Redo2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  selectedCount: number;
  saving?: boolean;
};

export function UndoRedoToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  selectedCount,
  saving,
}: Props) {
  return (
    <div className="flex items-center gap-2 rounded-lg border bg-white p-2 shadow">
      <Button variant="outline" size="sm" disabled={!canUndo} onClick={onUndo}>
        <Undo2 className="h-4 w-4 mr-1" />
        Undo
      </Button>
      <Button variant="outline" size="sm" disabled={!canRedo} onClick={onRedo}>
        <Redo2 className="h-4 w-4 mr-1" />
        Redo
      </Button>
      <span className="text-sm text-muted-foreground px-2">
        {selectedCount} selected
      </span>
      {saving && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Save className="h-3 w-3 animate-pulse" />
          Saving...
        </span>
      )}
    </div>
  );
}
