import { useAppStore } from '../../store/useAppStore';

export function ProvenanceChip({ claimId, publisher }: { claimId: string; publisher?: string }) {
  const openDrawer = useAppStore((s) => s.openDrawer);

  return (
    <button
      onClick={() => openDrawer({ id: 'provenance', type: 'provenance', contextId: claimId })}
      style={{
        padding: '2px 6px',
        borderRadius: '4px',
        backgroundColor: 'var(--color-surface-3)',
        border: '1px solid var(--color-border)',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-text)',
        cursor: 'pointer'
      }}
      title={`Provenance: ${claimId}`}
    >
      {publisher || claimId}
    </button>
  );
}
