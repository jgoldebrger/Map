"use client";

import { useCallback, useRef, useState } from "react";

export type HistoryEntry = {
  fipsCodes: string[];
  previousTerritoryIds: Record<string, string | null>;
  newTerritoryId: string;
};

export function useMapEditorHistory() {
  const undoStack = useRef<HistoryEntry[]>([]);
  const redoStack = useRef<HistoryEntry[]>([]);
  const [, forceUpdate] = useState(0);

  const push = useCallback((entry: HistoryEntry) => {
    undoStack.current.push(entry);
    redoStack.current = [];
    forceUpdate((n) => n + 1);
  }, []);

  const undo = useCallback(() => undoStack.current.pop() ?? null, []);
  const redo = useCallback(() => redoStack.current.pop() ?? null, []);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  const pushRedo = useCallback((entry: HistoryEntry) => {
    redoStack.current.push(entry);
    forceUpdate((n) => n + 1);
  }, []);

  const pushUndo = useCallback((entry: HistoryEntry) => {
    undoStack.current.push(entry);
    forceUpdate((n) => n + 1);
  }, []);

  return { push, undo, redo, canUndo, canRedo, pushRedo, pushUndo };
}
