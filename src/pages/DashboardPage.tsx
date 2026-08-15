/* ============================================================
   Executive Dashboard Page (SPEC-002 §6.1)
   Replaces mock dashboard with Evidence-driven dashboard.
   ============================================================ */

import { useEffect } from 'react';
import { useBlackboardStore } from '../store/useBlackboardStore';
import { ExternalLink, Activity, Info, CheckCircle2, ChevronRight, AlertTriangle, AlertCircle } from 'lucide-react';
import { Skeleton, Timestamp, StatCard } from '../components/primitives';
import { compositeCoverage, weakestDimension, coverageByDimension } from '../selectors/coverage';
import { openGaps, openBlockers, openContradictions } from '../selectors/evidence';
import { evidenceByPublisher } from '../selectors/publishers';
import { phaseProgress } from '../selectors/phase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

export function DashboardPage() {
  const blackboard = useBlackboardStore((state) => state.blackboard);
  const isLoading = useBlackboardStore((state) => state.isLoading);
  const load = useBlackboardStore((state) => state.load);
  const isInitialized = blackboard !== null;

  useEffect(() => {
    if (!isInitialized && !isLoading) {
      load();
    }
  }, [isInitialized, isLoading, load]);

  if (!isInitialized || isLoading || !blackboard) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Skeleton variant="row" height="100px" />
        <div style={{ marginTop: '24px', display: 'flex', gap: '24px' }}>
          <Skeleton variant="card" height="300px" />
          <Skeleton variant="card" height="300px" />
        </div>
      </div>
    );
  }

  // Row 1: Case Header Metrics
  const coverageScore = compositeCoverage(blackboard);
  const weakest = weakestDimension(blackboard);
  const isContextSupplied = blackboard.case.asset_context_supplied;

  // Row 2: Evidence State metrics
  const gaps = openGaps(blackboard);
  const blockers = openBlockers(blackboard);
  const contradictions = openContradictions(blackboard);
  const claimsAccepted = blackboard.claims.filter(c => c.status === 'accepted').length;

  // Row 3: Charts Data
  const coverageData = coverageByDimension(blackboard).sort((a, b) => a.value - b.value);
  const publisherData = Object.entries(evidenceByPublisher(blackboard))
    .map(([publisher, count]) => {
      const source = blackboard.sources.find(s => s.publisher === publisher);
      return { publisher, count, authorityClass: source?.authority_class || 'unknown' };
    })
    .sort((a, b) => b.count - a.count);

  const authorityColors: Record<string, string> = {
    government_advisory: 'var(--color-medium)',
    first_party: 'var(--color-accent)',
    researcher: 'var(--color-warning)',
    secondary: 'var(--color-text-dim)',
    unknown: 'var(--color-text-dim)'
  };

  // Row 4: Needs attention (top 5 open items)
  const needsAttention = [
    ...blockers.map(b => ({ id: b.blocker_id, type: 'blocker', text: b.details, icon: AlertTriangle, color: 'var(--color-critical)' })),
    ...contradictions.map(c => ({ id: c.contradiction_id, type: 'contradiction', text: `Unresolved: ${c.subject}`, icon: AlertCircle, color: 'var(--color-warning)' })),
    ...gaps.map(g => ({ id: g.gap_id, type: 'gap', text: g.description, icon: Info, color: 'var(--color-text-dim)' }))
  ].slice(0, 5);

  // Row 5: Phase Progress
  const { completedPhases, currentPhase, remainingPhases } = phaseProgress(blackboard);
  const allPhases = [...completedPhases, currentPhase, ...remainingPhases];

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Row 1: Case header band */}
      <div className="card flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3" style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
              {blackboard.case.case_id}
            </span>
            <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: 'var(--color-surface-3)', fontSize: '11px', fontWeight: 500, color: 'var(--color-text)' }}>
              {blackboard.case.status}
            </span>
            <span style={{ padding: '2px 8px', borderRadius: 'var(--radius-pill)', backgroundColor: 'color-mix(in srgb, var(--color-safe) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-safe) 20%, transparent)', fontSize: '11px', fontWeight: 500, color: 'var(--color-safe)' }}>
              {blackboard.case.derived_phase}
            </span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px' }}>
            {blackboard.advisory.title}
          </h1>
          <div className="flex items-center gap-4" style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
            <span>Published <Timestamp iso={blackboard.advisory.published_at} mode="absolute" /></span>
            <a href={blackboard.case.input_url} target="_blank" rel="noreferrer" className="flex items-center gap-1" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>
              <ExternalLink size={12} /> Source Advisory
            </a>
            <div className="flex items-center gap-1">
              {isContextSupplied ? <CheckCircle2 size={12} style={{ color: 'var(--color-safe)' }} /> : <AlertTriangle size={12} style={{ color: 'var(--color-warning)' }} />}
              Asset context {isContextSupplied ? 'supplied' : 'missing'}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>
            Evidence Coverage
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text)', lineHeight: 1 }}>
            {coverageScore}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-critical)', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
            <Activity size={12} /> weakest: {weakest.dimension} {weakest.value}
          </div>
        </div>
      </div>

      {/* Row 2: Evidence State Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
        <StatCard label="Open Gaps" value={`${gaps.length}/${blackboard.gaps.length}`} variant={gaps.length > 0 ? 'warning' : 'default'} onClick={() => {}} />
        <StatCard label="Open Blockers" value={`${blockers.length}/${blackboard.blockers.length}`} variant={blockers.length > 0 ? 'critical' : 'default'} onClick={() => {}} />
        <StatCard label="Open Contradictions" value={`${contradictions.length}/${blackboard.contradictions.length}`} variant={contradictions.length > 0 ? 'warning' : 'default'} onClick={() => {}} />
        <StatCard label="Claims Accepted" value={`${claimsAccepted}/${blackboard.claims.length}`} variant="default" onClick={() => {}} />
        <StatCard label="Total Sources" value={blackboard.sources.length} variant="default" onClick={() => {}} />
      </div>

      {/* Row 3: Charts Side by Side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px' }}>Coverage by Dimension</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={coverageData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis dataKey="dimension" type="category" width={140} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: 'var(--color-text)', fontSize: 12 }}>
                {coverageData.map((entry, index) => {
                  let color = 'var(--color-safe)';
                  if (entry.value < 60) color = 'var(--color-critical)';
                  else if (entry.value < 90) color = 'var(--color-medium)';
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Evidence by Publisher</h3>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-dim)' }}>
              <span className="flex items-center gap-1"><span style={{ width: 8, height: 8, borderRadius: '50%', background: authorityColors.government_advisory }}/> Gov</span>
              <span className="flex items-center gap-1"><span style={{ width: 8, height: 8, borderRadius: '50%', background: authorityColors.first_party }}/> Vendor</span>
              <span className="flex items-center gap-1"><span style={{ width: 8, height: 8, borderRadius: '50%', background: authorityColors.researcher }}/> Research</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={publisherData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="publisher" type="category" width={140} tick={{ fontSize: 12, fill: 'var(--color-text-muted)' }} axisLine={false} tickLine={false} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: 'var(--color-text)', fontSize: 12 }}>
                {publisherData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={authorityColors[entry.authorityClass] || authorityColors.unknown} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Row 4 & 5: Needs Attention & Closure Readiness */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Needs Attention */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px' }}>Needs Attention</h3>
          {needsAttention.length > 0 ? (
            <div className="flex flex-col gap-2">
              {needsAttention.map(item => (
                <div key={item.id} className="flex items-start justify-between" style={{ padding: '12px', backgroundColor: 'var(--color-surface-2)', borderRadius: 'var(--radius-card)', border: '1px solid var(--color-border)', cursor: 'pointer' }}>
                  <div className="flex items-start gap-3">
                    <item.icon size={16} style={{ color: item.color, marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)', marginBottom: '2px', textTransform: 'uppercase' }}>
                        {item.type}
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--color-text)', lineHeight: 1.4 }}>
                        {item.text}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--color-text-dim)' }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px 0' }}>
              No open items blocking closure.
            </div>
          )}
        </div>

        {/* Closure Readiness */}
        <div className="card">
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px' }}>Closure Readiness</h3>
          
          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
              Case closed at coverage {coverageScore}. Applicability remains at {blackboard.coverage.applicability} — closure records an investigation ticket, not a remediation, because no tenant evidence was available.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {allPhases.map((phase, idx) => {
              const isPast = completedPhases.includes(phase);
              const isCurrent = phase === currentPhase;
              
              let bgColor = 'var(--color-surface-2)';
              let borderColor = 'var(--color-border)';
              let textColor = 'var(--color-text-dim)';
              
              if (isPast || (isCurrent && phase === 'complete')) {
                bgColor = 'color-mix(in srgb, var(--color-safe) 10%, transparent)';
                borderColor = 'color-mix(in srgb, var(--color-safe) 30%, transparent)';
                textColor = 'var(--color-safe)';
              } else if (isCurrent) {
                bgColor = 'var(--color-accent-bg)';
                borderColor = 'var(--color-accent)';
                textColor = 'var(--color-accent)';
              }

              return (
                <div key={phase} className="flex items-center gap-2">
                  <div style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    backgroundColor: bgColor,
                    border: `1px solid ${borderColor}`,
                    fontSize: '11px',
                    fontWeight: isCurrent ? 600 : 500,
                    color: textColor,
                    textTransform: 'uppercase'
                  }}>
                    {phase}
                  </div>
                  {idx < allPhases.length - 1 && (
                    <div style={{ width: '12px', height: '1px', backgroundColor: 'var(--color-border)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
