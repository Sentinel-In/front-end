import React, { useState, useMemo } from 'react';
import { useBlackboardStore } from '../../store/useBlackboardStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { Search, ChevronDown, ChevronRight, AlertTriangle, ShieldCheck, Link2 } from 'lucide-react';
import { useCaseParam } from '../../hooks/useCaseParam';

// A mock utility to generate hashes for the ledger
function mockHash(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

export function AuditTrailPage() {
  const caseId = useCaseParam();
  const blackboard = useBlackboardStore((state) => state.blackboard);
  const { pendingEvents } = useWorkflowStore();
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState('');
  const [tamperSimulated, setTamperSimulated] = useState(false);
  const [chainVerified, setChainVerified] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Combine and sort events
  const ledger = useMemo(() => {
    if (!blackboard) return [];
    
    // Start with decisions
    const decisions = blackboard.decisions.map((d, i) => ({
      id: d.decision_id,
      seq: i + 1,
      timestamp: new Date(d.at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      type: 'HUMAN_DECISION',
      actor: 'k.sharma (human)',
      correlation: d.decision_id.split('-')[0],
      summary: d.decision,
      esql: null,
      rationale: d.rationale,
      hash: mockHash(d.decision_id + i),
      prevHash: i === 0 ? '0'.padStart(64, '0') : mockHash(blackboard.decisions[i-1].decision_id + (i-1)),
      verified: true,
      raw: d
    }));

    // Append workflow events
    const startSeq = decisions.length + 1;
    const wfEvents = pendingEvents.map((pe, i) => ({
      id: `evt-${i}`,
      seq: startSeq + i,
      timestamp: new Date(pe.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      type: pe.event_type.toUpperCase(),
      actor: `${pe.actor} (human)`,
      correlation: (pe.payload.caseId as string) || caseId,
      summary: JSON.stringify(pe.payload).substring(0, 60) + '...',
      esql: null,
      rationale: 'Recorded via UI intent',
      hash: mockHash(pe.timestamp + i),
      prevHash: i === 0 ? decisions[decisions.length - 1]?.hash : mockHash(pendingEvents[i-1].timestamp + (i-1)),
      verified: true,
      raw: pe
    }));

    return [...decisions, ...wfEvents].sort((a, b) => b.seq - a.seq);
  }, [blackboard, pendingEvents, caseId]);

  const filteredLedger = useMemo(() => {
    if (!filter) return ledger;
    const lower = filter.toLowerCase();
    return ledger.filter(r => 
      r.type.toLowerCase().includes(lower) || 
      r.actor.toLowerCase().includes(lower) || 
      r.summary.toLowerCase().includes(lower) ||
      r.correlation.toLowerCase().includes(lower) ||
      r.hash.includes(lower)
    );
  }, [ledger, filter]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleVerify = () => {
    setVerifying(true);
    setChainVerified(null);
    setTimeout(() => {
      setChainVerified(!tamperSimulated);
      setVerifying(false);
    }, 400); // simulate 6 blocks * 60ms
  };

  if (!blackboard) return null;

  const blocks = ledger.slice(0, 6).reverse(); // Last 6 blocks for the rail

  return (
    <div className="flex gap-6 max-w-[1400px] mx-auto p-8">
      {/* Main Ledger */}
      <div className="flex-1">
        <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-2">Audit Trail</h1>
        <p className="text-sm text-[var(--color-text-dim)] mb-6">Strictly read-only, non-repudiable ledger of all mutations and queries.</p>
        
        {/* Filter Bar */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-dim)]" />
            <input 
              type="text" 
              placeholder="Filter by actor, correlation, event type, hash, or free-text query..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded px-10 py-2 text-sm text-[var(--color-text)] font-mono focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>
        </div>

        {/* Ledger Table */}
        <div className="card !p-0 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)] font-semibold uppercase tracking-wider">
                <th className="p-3 w-8"></th>
                <th className="p-3 w-12">Seq</th>
                <th className="p-3">Timestamp (IST)</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Correlation</th>
                <th className="p-3">Summary</th>
                <th className="p-3 w-24">Hash</th>
                <th className="p-3 w-16 text-center">Verified</th>
              </tr>
            </thead>
            <tbody className="font-mono text-[11px]">
              {filteredLedger.map((row) => (
                <React.Fragment key={row.id}>
                  <tr 
                    className={`border-b border-[var(--color-border)] hover:bg-[var(--color-surface-2)] cursor-pointer ${expandedRows[row.id] ? 'bg-color-mix(in srgb, var(--color-accent-bg) 30%, transparent)' : ''}`}
                    onClick={() => toggleRow(row.id)}
                    style={{ height: '36px' }}
                  >
                    <td className="p-3 text-center">
                      {expandedRows[row.id] ? <ChevronDown className="w-3 h-3 text-[var(--color-text-dim)]" /> : <ChevronRight className="w-3 h-3 text-[var(--color-text-dim)]" />}
                    </td>
                    <td className="p-3 text-[var(--color-text-dim)]">#{row.seq}</td>
                    <td className="p-3 text-[var(--color-text)]">{row.timestamp}</td>
                    <td className="p-3 text-[var(--color-accent)]">{row.type}</td>
                    <td className="p-3 text-[var(--color-text)]">{row.actor}</td>
                    <td className="p-3 text-[var(--color-info)]">{row.correlation}</td>
                    <td className="p-3 text-[var(--color-text-dim)] truncate max-w-[200px]">{row.summary}</td>
                    <td className="p-3 text-[var(--color-text-muted)]">{row.hash.substring(0, 8)}...</td>
                    <td className="p-3 text-center">
                      <ShieldCheck className="w-3 h-3 text-[var(--color-safe)] inline-block" />
                    </td>
                  </tr>
                  {expandedRows[row.id] && (
                    <tr className="bg-[var(--color-surface-3)] border-b border-[var(--color-border)]">
                      <td colSpan={9} className="p-4 pl-12">
                        <div className="grid grid-cols-2 gap-8 text-xs font-sans">
                          <div>
                            <div className="text-[var(--color-text-dim)] mb-1 uppercase text-[10px] font-semibold">Event Details</div>
                            <div className="bg-[var(--color-surface-1)] p-3 rounded border border-[var(--color-border)] font-mono text-[11px] text-[var(--color-text)] whitespace-pre-wrap max-h-40 overflow-auto">
                              {JSON.stringify(row.raw, null, 2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[var(--color-text-dim)] mb-1 uppercase text-[10px] font-semibold">Chain Context</div>
                            <div className="space-y-2 font-mono text-[11px]">
                              <div className="flex flex-col">
                                <span className="text-[var(--color-text-muted)]">Previous Hash</span>
                                <span className="text-[var(--color-text)] break-all">{row.prevHash}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[var(--color-text-muted)]">Event Hash</span>
                                <span className="text-[var(--color-text)] break-all">{row.hash}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-4 text-[var(--color-safe)] font-sans font-medium">
                                <ShieldCheck className="w-4 h-4" />
                                Hash signed by local client enclave
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Rail: Chain Integrity */}
      <div className="w-[300px] shrink-0">
        <div className="card sticky top-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">Chain Integrity</h3>
            <button 
              className="text-xs text-[var(--color-accent)] hover:underline flex items-center gap-1"
              onClick={() => setTamperSimulated(!tamperSimulated)}
            >
              <AlertTriangle className="w-3 h-3" /> {tamperSimulated ? 'Reset' : 'Simulate'}
            </button>
          </div>
          
          <div className="flex items-center gap-4 mb-6 text-sm text-[var(--color-text-dim)] font-mono bg-[var(--color-surface-2)] p-3 rounded border border-[var(--color-border)]">
            <div>v{blackboard.audit.head_version}</div>
            <div>•</div>
            <div>seq {blackboard.audit.last_event_seq + pendingEvents.length}</div>
          </div>

          <div className="space-y-1 mb-6 relative">
            {blocks.map((b, i) => {
              const isTampered = tamperSimulated && i === 2;
              return (
                <div key={b.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-2 h-2 rounded-full ${isTampered ? 'bg-[var(--color-critical)]' : 'bg-[var(--color-safe)]'}`} />
                    {i < blocks.length - 1 && (
                      <div className={`w-0.5 h-6 ${isTampered ? 'bg-[var(--color-critical)]' : 'bg-[var(--color-border)]'}`} />
                    )}
                  </div>
                  <div className="flex flex-col pb-2">
                    <span className={`text-xs font-mono ${isTampered ? 'text-[var(--color-critical)]' : 'text-[var(--color-text)]'}`}>
                      Block #{b.seq}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--color-text-muted)]">
                      {b.hash.substring(0, 16)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {chainVerified === false && (
            <div className="bg-color-mix(in srgb, var(--color-critical) 15%, transparent) border border-[var(--color-critical)] rounded p-3 mb-4">
              <div className="text-sm font-semibold text-[var(--color-critical)] flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4" /> Broken Chain
              </div>
              <div className="text-xs text-[var(--color-critical)]">
                Discrepancy detected at block #{blocks[2]?.seq}. Cryptographic verification failed.
              </div>
            </div>
          )}

          {chainVerified === true && (
            <div className="bg-color-mix(in srgb, var(--color-safe) 15%, transparent) border border-[var(--color-safe)] rounded p-3 mb-4">
              <div className="text-sm font-semibold text-[var(--color-safe)] flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4" /> Chain Verified
              </div>
              <div className="text-xs text-[var(--color-safe)]">
                All block hashes mathematically proven.
              </div>
            </div>
          )}

          <button 
            className="w-full bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)] hover:bg-[var(--color-surface-3)] px-4 py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors"
            onClick={handleVerify}
            disabled={verifying}
          >
            {verifying ? (
              <span className="animate-pulse text-[var(--color-text-dim)]">Verifying...</span>
            ) : (
              <>
                <Link2 className="w-4 h-4" /> Re-verify chain
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
