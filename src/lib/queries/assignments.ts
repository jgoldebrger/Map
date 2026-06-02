export type AssignmentMap = Record<
  string,
  {
    territoryId: string;
    territoryName: string;
    shippingMethodId: string;
    color: string;
    shipDay: string | null;
    cutoffDay: string | null;
    notes: string | null;
    shippingMethod: string;
  }
>;

export async function fetchAssignments(): Promise<AssignmentMap> {
  const res = await fetch("/api/counties/assignments");
  if (!res.ok) throw new Error("Failed to load assignments");
  return res.json();
}
