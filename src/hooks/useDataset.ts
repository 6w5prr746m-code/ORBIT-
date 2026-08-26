import { useOrbitStore } from '@/state/orbitStore'

/** Convenience accessor for the active organization dataset + its id (throws contextually via callers). */
export function useDataset() {
  const dataset = useOrbitStore((s) => s.dataset)
  return dataset
}

export function useOrganizationId(): string | null {
  return useOrbitStore((s) => s.dataset?.organization.id ?? null)
}
