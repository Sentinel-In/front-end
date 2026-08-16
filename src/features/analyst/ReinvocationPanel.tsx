import { useState } from 'react';
import { useBlackboardStore } from '../../store/useBlackboardStore';
import { useWorkflowStore } from '../../store/useWorkflowStore';
import { useAppStore } from '../../store/useAppStore';
import { Send, AlertTriangle } from 'lucide-react';

export function ReinvocationPanel() {
  const bb = useBlackboardStore(s => s.blackboard);
  const requestReinvocation = useWorkflowStore(s => s.requestReinvocation);
  const openModal = useAppStore(s => s.openModal);

  // Pre-populate from blocked frontier entries and open gaps
  const initialUrls = bb ? Object.values(bb.frontier)
    .filter((f: any) => f.status === 'blocked')
    .map((f: any) => f.url)
    .join('\n') : '';

  const initialReason = bb ? Object.values(bb.gaps)
    .filter((g: any) => g.status === 'open' || g.status === 'blocked')
    .map((g: any) => `Need to address gap: ${g.question || g.description}`)
    .join('\n') : '';

  const [urls, setUrls] = useState(initialUrls);
  const [reason, setReason] = useState(initialReason);
  const [gain, setGain] = useState('Expected coverage gain: Identity +10%');
  const [budget, setBudget] = useState(1);

  if (!bb) return null;

  const maxWaves = bb.budgets.max_team_waves;
  const usedWaves = bb.budgets.team_waves_used;
  const remaining = maxWaves - usedWaves;
  // Current case is 4/4 in mock data typically, or remaining <= 0 means Lead path
  const requiresLeadAuth = budget > remaining;

  const handleSubmit = () => {
    const urlList = urls.split('\n').filter(u => u.trim() !== '');
    const intent = requestReinvocation(urlList, reason, gain, budget);
    
    openModal({
      id: 'reinvoke-intent',
      title: 'Request Reinvocation',
      component: 'CaseEventIntentModal',
      props: { intent, onConfirm: () => {} }
    });
  };

  return (
    <div className="card" style={{ marginTop: '24px' }}>
      <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px' }}>Targeted Reinvocation</h3>
      <div style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '16px' }}>
        Request additional data collection waves. Budget remaining: {remaining} waves.
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Target URLs / Source Class</label>
          <textarea 
            value={urls}
            onChange={e => setUrls(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', minHeight: '60px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Reason / Gap Addressed</label>
          <textarea 
            value={reason}
            onChange={e => setReason(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)', minHeight: '60px' }}
          />
        </div>

        <div className="flex gap-4">
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Expected Coverage Gain</label>
            <input 
              type="text" 
              value={gain}
              onChange={e => setGain(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, marginBottom: '4px' }}>Waves Requested</label>
            <input 
              type="number" 
              min="1" 
              value={budget}
              onChange={e => setBudget(parseInt(e.target.value))}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text)' }}
            />
          </div>
        </div>

        {requiresLeadAuth && (
          <div style={{ display: 'flex', gap: '8px', padding: '12px', background: 'color-mix(in srgb, var(--color-warning) 10%, transparent)', border: '1px solid var(--color-warning)', borderRadius: '6px', color: 'var(--color-text)', fontSize: '12px' }}>
            <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
            <span>Budget exhausted. This request will require Lead Manager authorization before execution.</span>
          </div>
        )}

        <button 
          className="btn-primary" 
          onClick={handleSubmit}
          disabled={!urls.trim() || !reason.trim()}
          style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Send size={14} /> Submit Request
        </button>
      </div>
    </div>
  );
}
