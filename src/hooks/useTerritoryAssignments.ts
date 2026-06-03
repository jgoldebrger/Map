"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAssignments,
  patchAssignmentMap,
  revertAssignmentMap,
  updateTerritoryInAssignmentMap,
  type AssignmentMap,
  type assignmentFromTerritory,
} from "@/lib/queries/assignments";

type TerritoryForAssignment = Parameters<typeof assignmentFromTerritory>[0];

export function useTerritoryAssignments() {
  return useQuery<AssignmentMap>({
    queryKey: ["assignments"],
    queryFn: fetchAssignments,
    staleTime: 0,
    structuralSharing: false,
  });
}

export function useInvalidateAssignments() {
  const qc = useQueryClient();
  return () => qc.refetchQueries({ queryKey: ["assignments"] });
}

export function usePatchAssignments() {
  const qc = useQueryClient();
  return (fipsCodes: string[], territory: TerritoryForAssignment | null) => {
    qc.setQueryData<AssignmentMap>(["assignments"], (current) =>
      patchAssignmentMap(current ?? {}, fipsCodes, territory),
    );
  };
}

export function useRevertAssignments() {
  const qc = useQueryClient();
  return (
    fipsCodes: string[],
    previousByFips: Record<string, AssignmentMap[string] | null | undefined>,
  ) => {
    qc.setQueryData<AssignmentMap>(["assignments"], (current) =>
      revertAssignmentMap(current ?? {}, fipsCodes, previousByFips),
    );
  };
}

export function useSyncTerritoryAssignments() {
  const qc = useQueryClient();
  return (
    territoryId: string,
    updates: Parameters<typeof updateTerritoryInAssignmentMap>[2],
  ) => {
    qc.setQueryData<AssignmentMap>(["assignments"], (current) =>
      updateTerritoryInAssignmentMap(current ?? {}, territoryId, updates),
    );
  };
}
