"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAssignments,
  patchAssignmentMap,
  type AssignmentMap,
  type assignmentFromTerritory,
} from "@/lib/queries/assignments";

type TerritoryForAssignment = Parameters<typeof assignmentFromTerritory>[0];

export function useTerritoryAssignments() {
  return useQuery<AssignmentMap>({
    queryKey: ["assignments"],
    queryFn: fetchAssignments,
    staleTime: 0,
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
