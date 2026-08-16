import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBlackboardStore } from '../../store/useBlackboardStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useAppStore } from '../../store/useAppStore';
import { ChevronLeft, FileText, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';
import type { AnalystRecommendation } from '../../types';
import { useCaseParam } from '../../hooks/useCaseParam';
import { ROUTES } from '../../routes';

export function RecommendationComposer() {
  const caseId = useCaseParam();
  const bb = useBlackboardStore(s => s.blackboard);
  const submitRecommendation = useWorkflowStore(s => s.submitRecommendation);
  const openModal = useAppStore(s => s.openModal);

  const [verdict, setVerdict] = useState<AnalystRecommendation['verdict']>('proceed');
  const [confidence, setConfidence] = useState(80);
  const [summary, setSummary] = useState('');
  const [citedClaims, setCitedClaims] = useState<string[]>([]);
  const [remediations] = useState<string[]>([]);
  const [escalate, setEscalate] = useState(false);

  if (!bb || bb.case.case_id !== caseId) {
    return <div style={{ padding: '32px 24px' }}>Loading case data...</div>;
  }

  const openGaps = Object.values(bb.gaps).filter((g: any) => g.status === 'open' || g.status === 'blocked');
  
  const handlePreview = () => {
    const rec: AnalystRecommendation = {
      case_id: caseId,
      verdict,
      confidence: confidence / 100,
      summary,
      cited_claim_ids: citedClaims,
      contradictions_addressed: [],
      residual_gaps: openGaps.map(g => g.gap_id),
      remediation_ids: remediations,
      escalate_to_executive: escalate
    };

    const intent = submitRecommendation(rec);
    openModal({
      id: 'case-event-intent-modal',
      title: 'Intent Preview',
      component: 'CaseEventIntentModal',
      props: { intent, onConfirm: () => {} }
    });
  };

  const isSubmitDisabled = citedClaims.length === 0 || summary.trim().length < 10 || summary.length > 300;

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>
      <Link to={ROUTES.alerts} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', textDecoration: 'none', fontSize: '13px', marginBottom: '24px' }}>
        <ChevronLeft size={16} /> Back to Alerts
      </Link>

      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>Compose Recommendation</h1>
        <div style={{ fontSize: '13px', color: 'var(--color-text-dim)' }}>Case: {caseId} — {bb.advisory.title}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="flex flex-col gap-6">
          
          {/* Verdict */}
          <div className="card">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Verdict</h3>
            <div className="flex gap-3">
              {[
                { val: 'proceed', label: 'Proceed to Gate 1', icon: CheckCircle2, color: 'var(--color-safe)' },
                { val: 'need_more_evidence', label: 'Need More Evidence', icon: FileText, color: 'var(--color-warning)' },
                { val: 'risk_accept', label: 'Recommend Risk Accept', icon: AlertTriangle, color: 'var(--color-critical)' },
                { val: 'not_applicable', label: 'Not Applicable', icon: ShieldAlert, color: 'var(--color-text-dim)' }
              ].map(opt => (
                <button 
                  key={opt.val}
                  onClick={() => setVerdict(opt.val as any)}
                  style={{ 
                    flex: 1, 
                    padding: '12px 8px', 
                    background: verdict === opt.val ? `color-mix(in srgb, ${opt.color} 15%, transparent)` : 'var(--color-surface-2)', 
                    border: `1px solid ${verdict === opt.val ? opt.color : 'var(--color-border)'}`,
                    borderRadius: '8px', 
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px'
                  }}
                >
                  <opt.icon size={20} style={{ color: verdict === opt.val ? opt.color : 'var(--color-text-muted)' }} />
                  <span style={{ fontSize: '12px', fontWeight: verdict === opt.val ? 600 : 500, color: verdict === opt.val ? opt.color : 'var(--color-text)' }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="card">
            <div className="flex justify-between items-center" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600 }}>Executive Summary</h3>
              <span style={{ fontSize: '12px', color: summary.length > 300 ? 'var(--color-critical)' : 'var(--color-text-muted)' }}>
                {summary.length} / 300 chars
              </span>
            </div>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Provide a concise 3-sentence summary of the recommendation..."
              style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', minHeight: '100px', fontSize: '13px', resize: 'vertical' }}
            />
          </div>

          {/* Claims Citation */}
          <div className="card">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Cited Claims (Required)</h3>
            <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '16px' }}>Select at least one claim to ground this recommendation in evidence.</div>
            
            <div className="flex flex-col gap-2">
              {Object.values(bb.claims).map((c: any) => (
                <label key={c.claim_id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    style={{ marginTop: '2px' }}
                    checked={citedClaims.includes(c.claim_id)} 
                    onChange={e => {
                      if (e.target.checked) setCitedClaims([...citedClaims, c.claim_id]);
                      else setCitedClaims(citedClaims.filter(id => id !== c.claim_id));
                    }} 
                  />
                  <div>
                    <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--color-accent)', marginBottom: '4px' }}>{c.claim_id}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>{c.content}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Right Rail */}
          <div className="card">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>Confidence Score</h3>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="0" max="100" 
                value={confidence} 
                onChange={e => setConfidence(parseInt(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', minWidth: '40px', textAlign: 'right' }}>{confidence}%</span>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Residual Gaps</h3>
            <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '12px' }}>These gaps will be explicitly passed to the Lead Manager.</div>
            {openGaps.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--color-text)' }}>No open gaps.</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--color-text)' }}>
                {openGaps.map((g: any) => (
                  <li key={g.gap_id} style={{ marginBottom: '6px' }}>{g.question || g.description}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="card">
            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Escalation</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--color-text)', cursor: 'pointer' }}>
              <input type="checkbox" checked={escalate} onChange={e => setEscalate(e.target.checked)} />
              Flag for Executive Review
            </label>
            <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginTop: '8px', marginLeft: '24px' }}>
              If checked, this case will require Gate 1 approval regardless of priority.
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--color-surface)', borderTop: '1px solid var(--color-border)', padding: '16px 24px', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>
          {citedClaims.length === 0 && <span style={{ color: 'var(--color-warning)' }}>Must cite at least one claim. </span>}
          {summary.length > 300 && <span style={{ color: 'var(--color-warning)' }}>Summary over character budget.</span>}
        </div>
        <button className="btn-primary" onClick={handlePreview} disabled={isSubmitDisabled}>
          Preview & Submit Recommendation
        </button>
      </div>
    </div>
  );
}
