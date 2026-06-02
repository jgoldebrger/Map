"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAssignments, type AssignmentMap } from "@/lib/queries/assignments";

export function useTerritoryAssignments() {
  return useQuery<AssignmentMap>({
    queryKey: ["assignments"],
    queryFn: fetchAssignments,
    staleTime: 30_000,
  });
}

export function useInvalidateAssignments() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["assignments"] });
}
