import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBlackboardStore } from '../../store/useBlackboardStore';
import { seededTickets } from '../../mock/workflowFixtures';
import { ChevronLeft, ShieldAlert, Lock, CheckCircle2, Circle, AlertTriangle, HardDrive } from 'lucide-react';
import { LockedControl } from '../../components/shared/LockedControl';

export function RunbookPage() {
  const { ticketId } = useParams();
  const ticket = seededTickets.find(t => t.ticket_id === ticketId);
  const bb = useBlackboardStore(s => s.blackboard);
  const load = useBlackboardStore(s => s.load);

  const [activePhase, setActivePhase] = useState(1);
  const [phase1Done, setPhase1Done] = useState(false);
  const [gate2Granted, setGate2Granted] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (ticket) {
      load(ticket.case_id);
    }
  }, [ticket, load]);

  if (!ticket || !bb || bb.case.case_id !== ticket.case_id) {
    return <div style={{ padding: '32px 24px' }}>Loading runbook...</div>;
  }

  const patchAuthorized = bb.remediation.some(r => 'patch_action_authorized' in r && r.patch_action_authorized);
  
  // Phase 1 remediations
  const phase1Rems = bb.remediation.filter(r => r.remediation_id.includes('recon') || r.remediation_id.includes('investigate'));
  // Phase 2 remediations
  const phase2Rems = bb.remediation.filter(r => !phase1Rems.includes(r));

  return (
    <div style={{ padding: '32px 24px', maxWidth: '900px', margin: '0 auto', paddingBottom: '100px' }}>
      <Link to="/tasks" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '13px', marginBottom: '24px' }}>
        <ChevronLeft size={16} /> Back to Tasks
      </Link>

      <div style={{ marginBottom: '32px' }}>
        <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '4px 8px', background: 'var(--color-surface-2)', borderRadius: '4px', color: 'var(--color-text-dim)' }}>
            {ticket.ticket_id}
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{ticket.title}</h1>
        </div>
        
        <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
          Case: {bb.case.case_id} — {bb.advisory.title}
        </div>

        {!patchAuthorized && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', border: '1px solid var(--color-warning)', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <ShieldAlert size={18} style={{ color: 'var(--color-warning)' }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-warning)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Investigation & Configuration — Not A Patch</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* Phase 1: Investigation & Configuration */}
        <PhasePanel 
          title="Phase 1: Investigation & Configuration" 
          active={activePhase === 1}
          onClick={() => setActivePhase(1)}
          status={phase1Done ? 'done' : 'active'}
        >
          <div className="flex flex-col gap-6">
            {phase1Rems.length > 0 ? phase1Rems.map((rem: any) => (
              <RemediationBlock key={rem.remediation_id} rem={rem} checks={checks} setChecks={setChecks} />
            )) : (
              <div style={{ fontSize: '13px', color: 'var(--color-text-dim)' }}>No Phase 1 remediations defined.</div>
            )}
            
            {!phase1Done && (
              <button 
                className="btn-primary" 
                onClick={() => setPhase1Done(true)}
                style={{ alignSelf: 'flex-start' }}
              >
                Complete Phase 1
              </button>
            )}
          </div>
        </PhasePanel>

        {/* Phase 2: Containment & Execution */}
        <PhasePanel 
          title="Phase 2: Containment & Execution" 
          active={activePhase === 2}
          onClick={() => {
            if (phase1Done && gate2Granted) setActivePhase(2);
          }}
          status={!phase1Done || !gate2Granted ? 'locked' : 'active'}
        >
          {(!phase1Done || !gate2Granted) ? (
            <div className="flex flex-col items-center justify-center gap-3" style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <Lock size={24} />
              <div style={{ fontSize: '13px' }}>
                {!phase1Done ? 'Complete Phase 1 to unlock.' : 'Awaiting containment authorisation from Lead Manager.'}
              </div>
              {phase1Done && !gate2Granted && (
                <>
                  <LockedControl capability="canAuthorizeContainment">
                    <button className="btn-primary" style={{ marginTop: '12px' }} onClick={() => setGate2Granted(true)}>
                      [Lead] Grant Gate 2 Auth
                    </button>
                  </LockedControl>
                  <button className="btn-secondary" style={{ marginTop: '12px' }}>Request Gate 2 Auth</button>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {phase2Rems.map((rem: any) => (
                <RemediationBlock key={rem.remediation_id} rem={rem} checks={checks} setChecks={setChecks} />
              ))}
            </div>
          )}
        </PhasePanel>

        {/* Phase 3: Verification */}
        <PhasePanel 
          title="Phase 3: Verification" 
          active={activePhase === 3}
          onClick={() => {
            if (gate2Granted) setActivePhase(3);
          }}
          status={!gate2Granted ? 'locked' : 'active'}
        >
          {bb.verification.map(v => {
            return (
              <div key={v.verification_id} className="card" style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>{v.scope}</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '16px' }}>Expected: {v.expected_result}</div>
                
                {v.acceptance_test ? (
                  <div style={{ padding: '12px', background: 'var(--color-surface-2)', borderRadius: '6px', fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--color-text)', marginBottom: '16px' }}>
                    {v.acceptance_test}
                  </div>
                ) : (
                  <div style={{ padding: '12px', background: 'color-mix(in srgb, var(--color-warning) 15%, transparent)', color: 'var(--color-warning)', borderRadius: '6px', fontSize: '12px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <AlertTriangle size={14} /> No dedicated acceptance test defined. Manual verification required.
                  </div>
                )}
                
                <div className="flex gap-3">
                  <button className="btn-primary" style={{ background: 'var(--color-safe)' }}>Pass Verification</button>
                  <button className="btn-secondary" style={{ color: 'var(--color-critical)', borderColor: 'var(--color-critical)' }}>Fail & Return to Lead</button>
                </div>
              </div>
            );
          })}
        </PhasePanel>
      </div>

      {/* Persistent Footer */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: '16px 24px', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>
          Changes are logged to the immutable ledger.
        </div>
        <button className="btn-secondary" style={{ color: 'var(--color-critical)' }}>
          Trigger Ticket Rollback
        </button>
      </div>
    </div>
  );
}

function PhasePanel({ title, active, status, onClick, children }: any) {
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--color-surface)' }}>
      <div 
        onClick={onClick}
        style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: status === 'locked' ? 'not-allowed' : 'pointer', background: active ? 'var(--color-surface-2)' : 'transparent', borderBottom: active ? '1px solid var(--color-border)' : 'none' }}
      >
        <div className="flex items-center gap-3">
          {status === 'done' ? <CheckCircle2 size={18} style={{ color: 'var(--color-safe)' }} /> : 
           status === 'locked' ? <Lock size={18} style={{ color: 'var(--color-text-muted)' }} /> :
           <Circle size={18} style={{ color: 'var(--color-accent)' }} />}
          <h2 style={{ fontSize: '15px', fontWeight: 600, color: status === 'locked' ? 'var(--color-text-muted)' : 'var(--color-text)', margin: 0 }}>
            {title}
          </h2>
        </div>
      </div>
      {active && (
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function RemediationBlock({ rem, checks, setChecks }: any) {
  const isDone = checks[`done-${rem.remediation_id}`];
  
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', background: isDone ? 'var(--color-surface-2)' : 'transparent', opacity: isDone ? 0.7 : 1 }}>
      <div className="flex items-start justify-between" style={{ marginBottom: '12px' }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px' }}>{rem.action || rem.title}</h3>
          <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>Target: {rem.target}</div>
        </div>
        {rem.restart_or_outage !== 'none' && (
          <span style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--color-critical)', color: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <HardDrive size={10} /> OUTAGE: {rem.restart_or_outage}
          </span>
        )}
      </div>

      {rem.prerequisites && rem.prerequisites.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-dim)', marginBottom: '8px', fontWeight: 600 }}>Pre-flight Checklist</div>
          <div className="flex flex-col gap-2">
            {rem.prerequisites.map((req: string, i: number) => {
              const id = `req-${rem.remediation_id}-${i}`;
              return (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={checks[id] || false} onChange={e => setChecks({ ...checks, [id]: e.target.checked })} />
                  {req}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {rem.action && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-dim)', marginBottom: '8px', fontWeight: 600 }}>Execution Payload</div>
          <div style={{ padding: '12px', background: '#000', color: '#0f0', fontFamily: 'var(--font-mono)', fontSize: '13px', borderRadius: '6px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
            {rem.action}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button 
          className="btn-primary" 
          onClick={() => setChecks({ ...checks, [`done-${rem.remediation_id}`]: true })}
          disabled={isDone}
        >
          {isDone ? 'Recorded as Done' : 'Record as Done'}
        </button>
        <button className="btn-secondary">Skip / Blocked...</button>
      </div>
      
      {rem.rollback && (
        <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--color-text-dim)', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
          Rollback procedure available.
        </div>
      )}
    </div>
  );
}
