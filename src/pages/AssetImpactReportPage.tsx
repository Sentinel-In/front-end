/* ============================================================
   Asset Impact Report Page (SPEC-002 §6.2)
   Replaces Annexure A form. Internal investigation report.
   ============================================================ */

import { useState } from 'react';
import type { Claim, Blocker, Gap } from '../types';
import { useBlackboardStore } from '../store/useBlackboardStore';
import { Download, AlertTriangle, FileText, CheckCircle2, Search, Info } from 'lucide-react';
import { Skeleton, Timestamp, ProvenanceChip } from '../components/primitives';
import { compositeCoverage } from '../selectors/coverage';
import { assetsByState } from '../selectors/assets';
import { openGaps, openBlockers, claimsByAsset } from '../selectors/evidence';
import { useCaseParam } from '../hooks/useCaseParam';

export function AssetImpactReportPage() {
  useCaseParam();
  const blackboard = useBlackboardStore((state) => state.blackboard);
  const isLoading = useBlackboardStore((state) => state.isLoading);
  const isInitialized = blackboard !== null;

  const [expandedAssets, setExpandedAssets] = useState<Record<string, boolean>>({});

  if (!isInitialized || isLoading || !blackboard) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <Skeleton variant="row" height="120px" />
        <div style={{ marginTop: '24px' }}>
          <Skeleton variant="card" height="300px" />
        </div>
      </div>
    );
  }

  const coverageScore = compositeCoverage(blackboard);
  const applicabilityScore = blackboard.coverage.applicability;
  const showHonestyBanner = applicabilityScore < 60;
  
  const assetCounts = assetsByState(blackboard);
  const gaps = openGaps(blackboard);
  const blockers = openBlockers(blackboard);

  const toggleAsset = (assetId: string) => {
    setExpandedAssets(prev => ({ ...prev, [assetId]: !prev[assetId] }));
  };

  const handleExportJson = () => {
    const exportPayload = {
      schema_version: blackboard.schema_version,
      case_id: blackboard.case.case_id,
      audit: blackboard.audit,
      report_generated_at: new Date().toISOString(),
      coverage: coverageScore,
      assets: blackboard.assets,
      remediation: blackboard.remediation,
      verification: blackboard.verification,
      gaps,
      blockers
    };
    
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asset-impact-report-${blackboard.case.case_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    // We would use jspdf or similar here. Mocking for now.
    alert(`Generating PDF Report... \n\nPayload: \nCase: ${blackboard.case.case_id}\nGenerated at: ${new Date().toISOString()}\nCoverage: ${coverageScore}`);
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--color-accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Asset Impact Report</h1>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '2px 6px', backgroundColor: 'var(--color-surface-3)', borderRadius: '4px', color: 'var(--color-text-dim)' }}>
                {blackboard.case.case_id}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: '4px 0 0' }}>
              {blackboard.advisory.title} · Generated <Timestamp iso={new Date().toISOString()} />
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', textTransform: 'uppercase' }}>Evidence Coverage</div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-text)' }}>{coverageScore}</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportJson} style={{ padding: '8px 12px', borderRadius: 'var(--radius-ctl)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-2)', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text)', fontSize: '13px', cursor: 'pointer' }}>
              <Download size={14} /> JSON
            </button>
            <button onClick={handleExportPdf} style={{ padding: '8px 12px', borderRadius: 'var(--radius-ctl)', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '13px', cursor: 'pointer', fontWeight: 500 }}>
              <Download size={14} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Honesty Banner */}
      {showHonestyBanner && (
        <div style={{ padding: '16px 20px', backgroundColor: 'color-mix(in srgb, var(--color-warning) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-warning) 30%, transparent)', borderRadius: 'var(--radius-card)', display: 'flex', gap: '12px' }}>
          <AlertTriangle size={20} style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px' }}>This is an investigation report, not a remediation plan.</h4>
            <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
              Applicability coverage is {applicabilityScore}. Vendor scope is established for both products, but no tenant, identity, licensing, configuration, token, or telemetry evidence was supplied. No asset is confirmed affected.
            </p>
          </div>
        </div>
      )}

      {/* Asset Summary Strip */}
      <div className="card flex items-center justify-between" style={{ padding: '16px 24px' }}>
        <div className="flex items-center gap-6">
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Affected <strong style={{ color: 'var(--color-text)' }}>{assetCounts.affected}</strong></div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Not affected <strong style={{ color: 'var(--color-text)' }}>{assetCounts.not_affected}</strong></div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Fixed <strong style={{ color: 'var(--color-text)' }}>{assetCounts.fixed}</strong></div>
          <div style={{ fontSize: '13px', color: 'var(--color-warning)', fontWeight: 500 }}>Under investigation <strong style={{ color: 'var(--color-warning)' }}>{assetCounts.under_investigation}</strong></div>
          <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Unknown <strong style={{ color: 'var(--color-text)' }}>{assetCounts.unknown}</strong></div>
        </div>
      </div>

      {/* Asset Matrix */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px' }}>Asset Matrix</h3>
        <div className="flex flex-col gap-4">
          {blackboard.assets.map(asset => {
            const isExpanded = !!expandedAssets[asset.asset_id];
            const claims = claimsByAsset(blackboard, asset.canonical_product);

            return (
              <div key={asset.asset_id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div 
                  className="flex items-start justify-between table-row-hover" 
                  style={{ padding: '20px', cursor: 'pointer', borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none' }}
                  onClick={() => toggleAsset(asset.asset_id)}
                >
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-3" style={{ marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>{asset.name}</h4>
                      <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}>{asset.canonical_product}</span>
                      <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--color-surface-3)', fontSize: '11px', color: 'var(--color-text-muted)' }} title="named in advisory scope; not an inventory match">
                        {asset.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-8" style={{ marginTop: '16px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px', textTransform: 'uppercase' }}>State</div>
                        <div className="flex items-center gap-2">
                          {asset.applicability === 'under_investigation' && <Search size={14} style={{ color: 'var(--color-warning)' }} />}
                          <span style={{ fontSize: '13px', fontWeight: 500, color: asset.applicability === 'under_investigation' ? 'var(--color-warning)' : 'var(--color-text)' }}>
                            {asset.applicability.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px', textTransform: 'uppercase' }}>Confidence</div>
                        <div className="flex items-center gap-2">
                          <div style={{ width: '40px', height: '4px', backgroundColor: 'var(--color-surface-3)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${asset.confidence * 100}%`, backgroundColor: 'var(--color-accent)' }} />
                          </div>
                          <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>{Math.round(asset.confidence * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px', textTransform: 'uppercase' }}>Version</div>
                        <div style={{ fontSize: '13px', color: asset.version ? 'var(--color-text)' : 'var(--color-text-dim)', fontStyle: asset.version ? 'normal' : 'italic' }}>
                          {asset.version || 'not established'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px', textTransform: 'uppercase' }}>Configuration</div>
                        <div style={{ fontSize: '13px', color: asset.configuration ? 'var(--color-text)' : 'var(--color-text-dim)', fontStyle: asset.configuration ? 'normal' : 'italic' }}>
                          {asset.configuration || 'not established'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '4px', textTransform: 'uppercase' }}>Deployment</div>
                        <div style={{ fontSize: '13px', color: asset.deployment_mode ? 'var(--color-text)' : 'var(--color-text-dim)', fontStyle: asset.deployment_mode ? 'normal' : 'italic' }}>
                          {asset.deployment_mode || 'not established'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 text-right">
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      Vendor scope {asset.vendor_scope_established ? <CheckCircle2 size={14} style={{ color: 'var(--color-safe)' }} /> : '❌'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                      Env: {asset.environmental_match || 'no tenant evidence supplied'}
                    </div>
                  </div>
                </div>

                {/* Sub-table for partitions */}
                {asset.partitions && asset.partitions.length > 0 && (
                  <div style={{ padding: '16px 20px', backgroundColor: 'var(--color-surface-2)', borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>Partitions</div>
                    <div className="flex flex-col gap-2">
                      {asset.partitions.map((p, i) => (
                        <div key={i} className="flex items-center gap-4">
                          <span style={{ fontSize: '13px', color: 'var(--color-text)' }}>{p.product}</span>
                          <span style={{ fontSize: '12px', color: p.state === 'under_investigation' ? 'var(--color-warning)' : 'var(--color-text-dim)', fontWeight: 500 }}>
                            {p.state.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Always visible rationale */}
                <div style={{ padding: '16px 20px', backgroundColor: 'var(--color-surface-2)', borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none' }}>
                  <p style={{ fontSize: '13px', color: 'var(--color-text)', margin: 0, lineHeight: 1.5, userSelect: 'text' }}>
                    <strong>Rationale:</strong> {asset.rationale}
                  </p>
                </div>

                {/* Expanded Claims */}
                {isExpanded && (
                  <div style={{ padding: '20px' }}>
                    <h5 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 12px', textTransform: 'uppercase' }}>Supporting Claims ({claims.length})</h5>
                    {claims.length > 0 ? (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ color: 'var(--color-text-dim)', borderBottom: '1px solid var(--color-border)' }}>
                            <th style={{ padding: '8px 0', fontWeight: 500 }}>Predicate</th>
                            <th style={{ padding: '8px 0', fontWeight: 500 }}>Confidence</th>
                            <th style={{ padding: '8px 0', fontWeight: 500 }}>Freshness</th>
                            <th style={{ padding: '8px 0', fontWeight: 500 }}>Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {claims.map((claim: Claim) => (
                            <tr key={claim.claim_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '12px 0', color: 'var(--color-text)' }}>{claim.predicate}</td>
                              <td style={{ padding: '12px 0', color: 'var(--color-text)' }}>{Math.round(claim.confidence * 100)}%</td>
                              <td style={{ padding: '12px 0', color: 'var(--color-text-muted)' }}>{claim.freshness}</td>
                              <td style={{ padding: '12px 0' }}>
                                <ProvenanceChip claimId={claim.claim_id} publisher={claim.source_scope.publisher} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>No direct claims found.</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Remediation Section */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px' }}>Remediation Plan</h3>
        <div className="flex flex-col gap-4">
          {blackboard.remediation.map(rem => (
            <div key={rem.remediation_id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 4px' }}>{(rem as any).action || (rem as any).title}</h4>
                  <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>Target: {rem.target}</div>
                </div>
                <div style={{ padding: '2px 8px', borderRadius: '12px', backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', fontSize: '11px', color: 'var(--color-text)' }}>
                  {rem.type}
                </div>
              </div>

              <div className="flex gap-12" style={{ marginTop: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>Prerequisites</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {((rem as any).prerequisites || []).map((req: string, i: number) => (
                      <li key={i} style={{ fontSize: '13px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-text-dim)' }} />
                        {req}
                      </li>
                    ))}
                    {!(rem as any).prerequisites && (rem as any).ordered_phases && (rem as any).ordered_phases.map((phase: string, i: number) => (
                      <li key={i} style={{ fontSize: '13px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--color-text-dim)' }} />
                        {phase}
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>Details</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text)', marginBottom: '6px' }}><strong>Impact:</strong> {rem.restart_or_outage}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text)', marginBottom: '6px' }}><strong>Rollback:</strong> {rem.rollback}</div>
                  <div style={{ fontSize: '13px', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong>Evidence:</strong> 
                    <div className="flex gap-2">
                      {rem.evidence_claim_ids.map(id => <ProvenanceChip key={id} claimId={id} />)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Suppressed Patch Action */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end' }}>
                {rem.fixed_target === null ? (
                  <div className="flex items-center gap-2" style={{ color: 'var(--color-text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                    <Info size={14} /> no fixed build established
                  </div>
                ) : (
                  <button style={{ padding: '6px 16px', borderRadius: 'var(--radius-ctl)', backgroundColor: 'var(--color-accent)', color: '#fff', fontSize: '13px', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
                    Deploy Patch to {rem.fixed_target}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Verification Section */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px' }}>Verification Tests</h3>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-surface-2)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-muted)' }}>Scope</th>
                <th style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-muted)' }}>Acceptance Test</th>
                <th style={{ padding: '12px 16px', fontWeight: 500, color: 'var(--color-text-muted)' }}>Expected Result</th>
              </tr>
            </thead>
            <tbody>
              {blackboard.verification.map(v => (
                <tr key={v.verification_id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text)', fontWeight: 500 }}>{v.scope}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}>{v.acceptance_test}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--color-text)' }}>{v.expected_result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Questions (Gaps & Blockers) */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 16px' }}>What would change this report</h3>
        <div className="flex flex-col gap-4">
          
          {blockers.length > 0 && (
            <div className="card">
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-critical)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} /> Blockers ({blockers.length})
              </h4>
              <div className="flex flex-col gap-3">
                {blockers.map((b: Blocker) => (
                  <div key={b.blocker_id} style={{ padding: '12px', backgroundColor: 'var(--color-surface-2)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '4px' }}>{b.details}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Class: {b.class} · Effect: {b.effect}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gaps.length > 0 && (
            <div className="card">
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-warning)', margin: '0 0 12px' }}>Open Gaps ({gaps.length})</h4>
              <div className="flex flex-col gap-3">
                {gaps.map((g: Gap) => (
                  <div key={g.gap_id} style={{ padding: '12px', backgroundColor: 'var(--color-surface-2)', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text)', marginBottom: '4px' }}>{g.description}</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Resolution: {g.resolution}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>

    </div>
  );
}
