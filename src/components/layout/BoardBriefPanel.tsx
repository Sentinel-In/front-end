import { BarChart, Bar, CartesianGrid, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { seededBoardBrief } from '../../mock/workflowFixtures';
import { useCaseIndexStore } from '../../store/useCaseIndexStore';
import { useBlackboardStore } from '../../store/useBlackboardStore';
import { DataTable } from '../primitives';

export function BoardBriefPanel() {
  const brief = seededBoardBrief;
  const cases = useCaseIndexStore(s => s.cases);
  const blackboard = useBlackboardStore(s => s.blackboard);

  // Forbidden-content guard (RC-3 Phase 3)
  if (import.meta.env.DEV) {
    const forbidden = [
      /CVE-\d{4}-\d{4,7}/i, 
      /apt\d+/i, 
      /lazarus/i,
      /identity/i, /sources/i, /affected_assets/i, /applicability/i, 
      /exploitability/i, /impact/i, /remediation/i, /operational_change/i, 
      /verification/i, /provenance_freshness/i,
      /[a-f0-9]{64}/,
      /C-[A-Z0-9]{6}/
    ];
    Object.values(brief.sections).forEach(section => {
      forbidden.forEach(regex => {
        if (regex.test(section.content)) {
          throw new Error(`Forbidden content in Board Brief section '${section.title}': ${regex}`);
        }
      });
    });
  }

  const renderFigure = (key: string) => {
    switch (key) {
      case 'posture':
        return (
          <div className="h-32 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Prior', opened: 45, closed: 38, pending: 7 }, 
                { name: 'Current', opened: 52, closed: 41, pending: 11 }
              ]} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--color-text-dim)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-dim)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border-2)', borderRadius: 'var(--radius-ctl)' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="opened" fill="var(--color-accent)" stackId="a" />
                <Bar dataKey="closed" fill="var(--color-safe)" stackId="b" />
                <Bar dataKey="pending" fill="var(--color-medium)" stackId="b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case 'duty_of_care':
        return (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-[var(--color-surface-2)] p-2 rounded">
              <div className="text-[10px] text-[var(--color-text-dim)] uppercase">Cases Handled</div>
              <div className="text-lg font-semibold">{cases.length}</div>
            </div>
            <div className="bg-[var(--color-surface-2)] p-2 rounded">
              <div className="text-[10px] text-[var(--color-text-dim)] uppercase">Full Evidence Cycle</div>
              <div className="text-lg font-semibold">92%</div>
            </div>
            <div className="bg-[var(--color-surface-2)] p-2 rounded">
              <div className="text-[10px] text-[var(--color-text-dim)] uppercase">Human Decisions</div>
              <div className="text-lg font-semibold">{blackboard?.decisions.length || 9}</div>
            </div>
            <div className="bg-[var(--color-surface-2)] p-2 rounded">
              <div className="text-[10px] text-[var(--color-text-dim)] uppercase">Ledger Version</div>
              <div className="text-lg font-semibold">{brief.ledger_head_version}</div>
            </div>
          </div>
        );
      case 'unknowns':
        return (
          <div className="mb-4 text-xs">
            <DataTable
              columns={[
                { key: 'caseId', label: 'Case', width: '100px' },
                { key: 'missing', label: 'Unestablished' },
                { key: 'blocker', label: 'Blocker' },
                { key: 'fix', label: 'Resolution' },
              ]}
              data={[
                { id: '1', caseId: 'CIAD-0037', missing: 'Deployment topology', blocker: 'Missing asset context', fix: 'CMDB scan' },
                { id: '2', caseId: 'CIAD-0041', missing: 'Patch applicability', blocker: 'Vendor offline', fix: 'Vendor advisory' }
              ]}
              rowKey={(r: any) => r.id}
            />
          </div>
        );
      case 'decisions':
        return (
          <div className="mb-4 bg-[var(--color-surface-2)] p-3 rounded">
            <div className="text-xl font-semibold mb-2 text-[var(--color-medium)]">2 Exec Authorisations</div>
            <ul className="text-xs space-y-1 text-[var(--color-text-dim)]">
              <li>• CIAD-0037 Containment (k.sharma, Aug 14)</li>
              <li>• CIAD-0041 Exception (a.patel, Aug 12)</li>
            </ul>
          </div>
        );
      case 'ask':
        return (
          <div className="mb-4 p-3 rounded border" style={{ borderColor: 'var(--color-accent)', backgroundColor: 'var(--color-accent-bg)' }}>
            <div className="text-xs font-semibold text-[var(--color-accent-soft)] mb-1">Required Resourcing</div>
            <ul className="text-xs space-y-1 text-[var(--color-text-2)]">
              <li>• External API Access (Resolves CIAD-0041)</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <section className="card" style={{ borderLeft: '4px solid var(--color-safe)' }} aria-label="Frozen board brief">
      <div className="flex items-start justify-between" style={{ marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px' }}>
            Board Brief: {brief.period}
          </h2>
          <div style={{ fontSize: '13px', color: 'var(--color-text-dim)' }}>
            Status: <span style={{ color: 'var(--color-safe)' }}>{brief.status.toUpperCase()}</span> • Attested by {brief.attested_by}
          </div>
        </div>
        <div style={{ textAlign: 'right', fontSize: '12px', color: 'var(--color-text-muted)' }}>
          <div>{brief.frozen_at ? `Frozen on ${new Date(brief.frozen_at).toLocaleDateString()}` : 'Not frozen'}</div>
          <div>Ledger version: {brief.ledger_head_version}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
        {Object.entries(brief.sections).map(([key, section]) => (
          <div key={key} className="flex flex-col">
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>
              {section.title}
            </div>
            {renderFigure(key)}
            <div style={{ fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.5, flex: 1 }}>
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
