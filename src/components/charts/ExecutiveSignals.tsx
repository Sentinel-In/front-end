import { AlertTriangle, ArrowUpRight, Boxes, CircleAlert, ShieldAlert } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ROUTES, withCaseId } from '../../routes';
import {
  assetsNotEstablished,
  coverageDistribution,
  executiveAlerts,
} from '../../selectors/executiveDashboard';
import { useBlackboardStore } from '../../store/useBlackboardStore';

const toneColor = {
  critical: 'var(--color-critical)',
  medium: 'var(--color-medium)',
  safe: 'var(--color-safe)',
} as const;

export function ExecutiveMetricStrip() {
  const blackboard = useBlackboardStore((state) => state.blackboard);
  if (!blackboard) return null;

  const alerts = executiveAlerts(blackboard);
  const critical = alerts.filter((alert) => alert.severity === 'Critical').length;
  const unknownAssets = assetsNotEstablished(blackboard);
  const metrics = [
    {
      label: 'Active alerts · derived',
      value: alerts.length,
      note: 'Current blackboard findings',
      icon: CircleAlert,
      color: 'var(--color-accent-soft)',
    },
    {
      label: 'Critical · derived',
      value: critical,
      note: 'Open high-materiality contradiction',
      icon: ShieldAlert,
      color: 'var(--color-critical)',
    },
    {
      label: 'Assets not established',
      value: `${unknownAssets}/${blackboard.assets.length}`,
      note: 'Version, configuration or match unknown',
      icon: Boxes,
      color: 'var(--color-medium)',
    },
    {
      label: 'Open blockers',
      value: blackboard.blockers.filter((blocker) => blocker.status === 'open').length,
      note: 'Named evidence dependencies',
      icon: AlertTriangle,
      color: 'var(--color-high)',
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3" aria-label="Executive evidence signals">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <article className="card" style={{ padding: '18px 20px' }} key={metric.label}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div style={{ color: 'var(--color-text-dim)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {metric.label}
                </div>
                <div style={{ color: metric.color, fontFamily: 'var(--font-mono)', fontSize: '30px', fontWeight: 600, lineHeight: 1.2, marginTop: '8px' }}>
                  {metric.value}
                </div>
                <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', marginTop: '5px' }}>{metric.note}</div>
              </div>
              <div style={{ alignItems: 'center', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-ctl)', color: metric.color, display: 'flex', height: '34px', justifyContent: 'center', width: '34px' }}>
                <Icon size={17} aria-hidden="true" />
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function ActiveAlertsPanel() {
  const blackboard = useBlackboardStore((state) => state.blackboard);
  const navigate = useNavigate();
  if (!blackboard) return null;

  const alerts = executiveAlerts(blackboard);
  return (
    <section className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="flex items-start justify-between gap-4" style={{ borderBottom: '1px solid var(--color-border)', padding: '20px 22px' }}>
        <div>
          <div className="flex items-center gap-2">
            <CircleAlert size={17} style={{ color: 'var(--color-accent-soft)' }} aria-hidden="true" />
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Active alerts</h2>
            <span style={{ background: 'var(--color-accent-bg)', borderRadius: 'var(--radius-pill)', color: 'var(--color-accent-soft)', fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '2px 8px' }}>
              DERIVED
            </span>
          </div>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', margin: '5px 0 0' }}>Executive summaries derived from current blackboard findings.</p>
        </div>
      </div>
      <div>
        {alerts.map((alert) => {
          const target = alert.destination === 'evidence'
            ? withCaseId(ROUTES.evidenceCase, blackboard.case.case_id)
            : withCaseId(ROUTES.gapsCase, blackboard.case.case_id);
          const color = alert.severity === 'Critical' ? 'var(--color-critical)' : 'var(--color-high)';
          return (
            <button
              className="table-row-hover"
              key={alert.id}
              onClick={() => navigate(target)}
              style={{ alignItems: 'center', background: 'transparent', border: 0, borderBottom: '1px solid var(--color-border)', color: 'inherit', cursor: 'pointer', display: 'grid', gap: '14px', gridTemplateColumns: '88px 1fr auto', padding: '15px 22px', textAlign: 'left', width: '100%' }}
              type="button"
            >
              <span style={{ color, fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{alert.severity}</span>
              <span>
                <span style={{ display: 'block', fontSize: '13px', fontWeight: 600 }}>{alert.title}</span>
                <span style={{ color: 'var(--color-text-muted)', display: 'block', fontSize: '12px', marginTop: '3px' }}>{alert.explanation}</span>
              </span>
              <ArrowUpRight size={16} style={{ color: 'var(--color-text-dim)' }} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function AlertTrendCard() {
  const blackboard = useBlackboardStore((state) => state.blackboard);
  if (!blackboard) return null;

  const currentCount = executiveAlerts(blackboard).length;
  const data: Array<{ label: string; alerts: number | null }> = [
    { label: 'Earlier', alerts: null },
    { label: '', alerts: null },
    { label: '', alerts: null },
    { label: 'Now', alerts: currentCount },
  ];

  return (
    <section className="card flex flex-col" style={{ minHeight: '286px' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Alert trend</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', margin: '5px 0 0' }}>Materialized blackboard alert state</p>
        </div>
        <span style={{ border: '1px solid var(--color-border-2)', borderRadius: 'var(--radius-pill)', color: 'var(--color-text-muted)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em', padding: '3px 8px', textTransform: 'uppercase' }}>
          Current snapshot only
        </span>
      </div>
      <div style={{ flex: 1, minHeight: '150px', marginTop: '14px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 12, left: -26, bottom: 0 }}>
            <defs>
              <linearGradient id="alertArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.32} />
                <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-dim)', fontSize: 11 }} />
            <YAxis allowDecimals={false} axisLine={false} domain={[0, Math.max(5, currentCount + 1)]} tickLine={false} tick={{ fill: 'var(--color-text-dim)', fontSize: 11 }} />
            <Tooltip contentStyle={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border-2)', borderRadius: 'var(--radius-ctl)' }} />
            <Area dataKey="alerts" stroke="var(--color-accent-soft)" strokeWidth={2} fill="url(#alertArea)" dot={{ fill: 'var(--color-accent-soft)', r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p style={{ color: 'var(--color-text-dim)', fontSize: '11px', margin: '8px 0 0' }}>
        Historical alert states are not present in this blackboard, so the UI does not fabricate a trend.
      </p>
    </section>
  );
}

export function CoverageDistributionCard() {
  const blackboard = useBlackboardStore((state) => state.blackboard);
  if (!blackboard) return null;

  const bands = coverageDistribution(blackboard);
  return (
    <section className="card" style={{ minHeight: '286px' }}>
      <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Coverage distribution</h2>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', margin: '5px 0 0' }}>Evidence dimensions by established coverage band</p>
      <div className="flex flex-col gap-5" style={{ marginTop: '28px' }}>
        {bands.map((band) => (
          <div key={band.label}>
            <div className="flex items-center justify-between" style={{ fontSize: '12px', marginBottom: '8px' }}>
              <span style={{ color: 'var(--color-text-2)' }}>{band.label}</span>
              <span style={{ color: toneColor[band.tone], fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{band.count}/{band.total}</span>
            </div>
            <div style={{ background: 'var(--color-surface-2)', borderRadius: 'var(--radius-pill)', height: '8px', overflow: 'hidden' }}>
              <div style={{ background: toneColor[band.tone], borderRadius: 'var(--radius-pill)', height: '100%', width: `${(band.count / band.total) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p style={{ color: 'var(--color-text-dim)', fontSize: '11px', margin: '25px 0 0' }}>Coverage describes evidence completeness, not organizational risk.</p>
    </section>
  );
}
