"use client";

import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StateMultiSelect } from "@/components/map/editor/StateMultiSelect";
import { cn } from "@/lib/utils";

export type CountyClickMode = "add" | "replace";

type Territory = {
  id: string;
  name: string;
  shippingMethod: { name: string };
};

type ToolbarSectionProps = {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

function ToolbarSection({ label, description, children, className }: ToolbarSectionProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        {description && (
          <p className="text-[11px] leading-snug text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

type Props = {
  countyClickMode: CountyClickMode;
  onCountyClickModeChange: (mode: CountyClickMode) => void;
  boxSelectMode: boolean;
  onBoxSelectModeChange: (enabled: boolean) => void;
  polygonMode: boolean;
  onPolygonModeChange: (enabled: boolean) => void;
  selectedCount: number;
  onClearSelection: () => void;
  statePicker: Set<string>;
  onStatePickerChange: (states: Set<string>) => void;
  onReplaceWithStates: () => void;
  onAddStates: () => void;
  territories: Territory[];
  assignTerritoryId: string;
  onAssignTerritoryIdChange: (id: string) => void;
  onAssignCounties: () => void;
  saving: boolean;
  zipPanelOpen: boolean;
  onZipPanelOpenChange: (open: boolean) => void;
  canUndo: boolean;
  onUndo: () => void;
  assignError: string | null;
  zipMessage: string | null;
};

export function MapEditorToolbar({
  countyClickMode,
  onCountyClickModeChange,
  boxSelectMode,
  onBoxSelectModeChange,
  polygonMode,
  onPolygonModeChange,
  selectedCount,
  onClearSelection,
  statePicker,
  onStatePickerChange,
  onReplaceWithStates,
  onAddStates,
  territories,
  assignTerritoryId,
  onAssignTerritoryIdChange,
  onAssignCounties,
  saving,
  zipPanelOpen,
  onZipPanelOpenChange,
  canUndo,
  onUndo,
  assignError,
  zipMessage,
}: Props) {
  const enableBoxSelect = () => {
    onBoxSelectModeChange(true);
    onPolygonModeChange(false);
  };

  const disableBoxSelect = () => {
    onBoxSelectModeChange(false);
  };

  const enablePolygon = () => {
    onPolygonModeChange(true);
    onBoxSelectModeChange(false);
  };

  const disablePolygon = () => {
    onPolygonModeChange(false);
  };

  return (
    <div className="shrink-0 border-b bg-white shadow-sm">
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-bold tracking-tight">Map Editor</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Select counties, assign a territory, or open ZIP overrides for exceptions like the
          Florida Keys.
        </p>
      </div>

      <div className="grid gap-4 px-4 py-3 lg:grid-cols-2 xl:grid-cols-4">
        <ToolbarSection
          label="1. Select counties"
          description="Click the map, drag a box, draw a shape, or pick states."
        >
          <div className="flex rounded-md border p-0.5">
            <Button
              type="button"
              size="sm"
              variant={countyClickMode === "add" ? "default" : "ghost"}
              className="h-8 rounded-sm px-2.5 text-xs"
              onClick={() => onCountyClickModeChange("add")}
            >
              Add clicks
            </Button>
            <Button
              type="button"
              size="sm"
              variant={countyClickMode === "replace" ? "default" : "ghost"}
              className="h-8 rounded-sm px-2.5 text-xs"
              onClick={() => onCountyClickModeChange("replace")}
            >
              Replace clicks
            </Button>
          </div>
          {boxSelectMode ? (
            <Button type="button" size="sm" variant="default" onClick={disableBoxSelect}>
              Exit box select
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" onClick={enableBoxSelect}>
              Box select
            </Button>
          )}
          {polygonMode ? (
            <Button type="button" size="sm" variant="default" onClick={disablePolygon}>
              Exit polygon
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" onClick={enablePolygon}>
              Draw polygon
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={selectedCount === 0}
            onClick={onClearSelection}
          >
            Clear selection
          </Button>
        </ToolbarSection>

        <ToolbarSection
          label="2. Select by state"
          description="Choose states, then add or replace your county list."
        >
          <StateMultiSelect selected={statePicker} onChange={onStatePickerChange} />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={statePicker.size === 0}
            onClick={onReplaceWithStates}
          >
            Replace with states
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={statePicker.size === 0}
            className="text-muted-foreground"
            onClick={onAddStates}
          >
            Add states
          </Button>
        </ToolbarSection>

        <ToolbarSection
          label="3. Assign territory"
          description="Apply the chosen territory to all selected counties."
        >
          <div className="flex w-full min-w-[12rem] flex-col gap-1">
            <Label className="sr-only">Territory</Label>
            <Select value={assignTerritoryId} onValueChange={onAssignTerritoryIdChange}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue placeholder="Choose territory" />
              </SelectTrigger>
              <SelectContent>
                {territories.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} · {t.shippingMethod.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={!assignTerritoryId || selectedCount === 0 || saving}
            onClick={onAssignCounties}
          >
            {saving ? "Assigning…" : `Assign ${selectedCount} counties`}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!canUndo}
            onClick={onUndo}
            title="Undo last assignment"
          >
            <Undo2 className="h-4 w-4" />
            <span className="sr-only">Undo</span>
          </Button>
        </ToolbarSection>

        <ToolbarSection
          label="4. ZIP overrides"
          description="Override county territory for specific ZIP codes."
        >
          <Button
            type="button"
            size="sm"
            variant={zipPanelOpen ? "default" : "outline"}
            onClick={() => onZipPanelOpenChange(!zipPanelOpen)}
          >
            {zipPanelOpen ? "Close ZIP panel" : "Open ZIP panel"}
          </Button>
        </ToolbarSection>
      </div>

      {(boxSelectMode || polygonMode || assignError || zipMessage) && (
        <div className="border-t bg-muted/30 px-4 py-2 text-sm">
          {boxSelectMode && (
            <p className="text-muted-foreground">Box select active — drag on the map.</p>
          )}
          {polygonMode && !boxSelectMode && (
            <p className="text-muted-foreground">Polygon tool active — draw on the map.</p>
          )}
          {assignError && <p className="text-destructive">{assignError}</p>}
          {!assignError && zipMessage && (
            <p className="text-muted-foreground">{zipMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}
