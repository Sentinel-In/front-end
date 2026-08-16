/* ============================================================
   Provenance Drawer (SPEC-002 §6.3, §10)
   Displays raw excerpts, hashes, and extraction methods.
   ============================================================ */

import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Copy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useBlackboardStore } from '../../store/useBlackboardStore';
import { RoleGate } from '../primitives';

export function ProvenanceDrawer() {
  const { drawer, closeDrawer } = useAppStore();
  const blackboard = useBlackboardStore((s) => s.blackboard);

  const isOpen = drawer?.type === 'provenance';
  const claimId = drawer?.contextId; // we'll pass claimId here

  if (!blackboard || !claimId) return null;

  const claim = blackboard.claims.find(c => c.claim_id === claimId);
  if (!claim) return null;

  // Wait, claim has source_scope.
  const scope = claim.source_scope;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDrawer}
          />
          
          {/* Drawer */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50"
            style={{
              width: '440px',
              backgroundColor: 'var(--color-surface)',
              borderLeft: '1px solid var(--color-border)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.1)'
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between" style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
              <div className="flex items-center gap-3">
                <div style={{ width: 32, height: 32, borderRadius: '8px', backgroundColor: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Search size={16} style={{ color: 'var(--color-text)' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Provenance</h3>
                  <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)', marginTop: '2px' }}>{claimId}</div>
                </div>
              </div>
              <button
                onClick={closeDrawer}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-ctl)',
                  color: 'var(--color-text-muted)',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              
              <RoleGate capability="canViewRawEvidence">
                <div className="flex flex-col gap-6">
                  {/* Metadata */}
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px', textTransform: 'uppercase' }}>Publisher</div>
                    <div style={{ fontSize: '14px', color: 'var(--color-text)' }}>{scope.publisher}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px', textTransform: 'uppercase' }}>Locator</div>
                    <div style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--color-text)', padding: '12px', backgroundColor: 'var(--color-surface-2)', borderRadius: '6px', border: '1px solid var(--color-border)', wordBreak: 'break-all' }}>
                      {scope.locator}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px', textTransform: 'uppercase' }}>Extraction Method</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{scope.extraction_method}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px', textTransform: 'uppercase' }}>Artifact Hash (SHA-256)</div>
                    <div className="flex items-center gap-2">
                      <div style={{ flex: 1, fontSize: '13px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>
                        {scope.artifact_sha256}
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(scope.artifact_sha256);
                          useAppStore.getState().pushToast({ message: 'Hash copied', type: 'info', duration: 2000 });
                        }}
                        style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'var(--color-text)' }}
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>Raw Excerpt</div>
                    <div style={{ 
                      fontSize: '13px', 
                      fontFamily: 'var(--font-mono)', 
                      color: 'var(--color-text)', 
                      padding: '16px', 
                      backgroundColor: 'var(--color-surface-3)', 
                      borderRadius: '6px', 
                      border: '1px solid var(--color-border)',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.5
                    }}>
                      {scope.raw_excerpt}
                    </div>
                  </div>
                </div>
              </RoleGate>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
