import { useMemo, useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { useBlackboardStore } from '../../store/useBlackboardStore';
import type { Source } from '../../types';

type GraphNode = Source & {
  depth: number;
  x: number;
  y: number;
  artifactHash: string | null;
};

const columnLabels = ['Origin', 'Direct references', 'Evidence expansion', 'Verification'];

function authorityColor(authorityClass: string): string {
  if (authorityClass.includes('government')) return 'var(--color-accent)';
  if (authorityClass.includes('first_party')) return 'var(--color-safe)';
  if (authorityClass.includes('research')) return 'var(--color-medium)';
  return 'var(--color-text-muted)';
}

function edgeDash(status: string): string | undefined {
  return status === 'leased' ? '6 5' : undefined;
}

export function ProvenanceGraph() {
  const blackboard = useBlackboardStore((state) => state.blackboard);
  const openDrawer = useAppStore((state) => state.openDrawer);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const graphData = useMemo(() => {
    if (!blackboard) return { nodes: [] as GraphNode[], width: 1280, height: 760 };

    const depths: Record<string, number> = {};
    blackboard.reference_edges.forEach((edge) => {
      if (edge.to_source_id) depths[edge.to_source_id] = Math.min(3, edge.depth);
      if (edge.from_source_id && depths[edge.from_source_id] === undefined) {
        depths[edge.from_source_id] = Math.max(0, edge.depth - 1);
      }
    });

    const columns: Source[][] = [[], [], [], []];
    blackboard.sources.forEach((source) => columns[depths[source.source_id] ?? 0].push(source));

    const width = 1280;
    const maxColumnSize = Math.max(...columns.map((column) => column.length));
    const height = Math.max(760, maxColumnSize * 76 + 100);
    const columnWidth = width / columns.length;

    const nodes = blackboard.sources.map((source): GraphNode => {
      const depth = depths[source.source_id] ?? 0;
      const index = columns[depth].indexOf(source);
      const availableHeight = height - 100;
      const spacing = availableHeight / columns[depth].length;
      const artifact = blackboard.artifacts.find((item) => item.artifact_id === source.artifact_id);
      return {
        ...source,
        depth,
        x: columnWidth * depth + columnWidth / 2,
        y: 74 + spacing * (index + 0.5),
        artifactHash: artifact?.sha256 ?? null,
      };
    });

    return { nodes, width, height };
  }, [blackboard]);

  if (!blackboard) return null;

  return (
    <section className="card" style={{ flexShrink: 0, overflow: 'hidden', padding: 0 }} aria-label="Evidence provenance graph">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4" style={{ borderBottom: '1px solid var(--color-border)', padding: '16px 20px' }}>
        <div>
          <h2 style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>Provenance graph</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', margin: '4px 0 0' }}>
            {blackboard.sources.length} source nodes · {blackboard.reference_edges.length} reference edges · click a node for preserved collection proof
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2" style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>
          <span className="flex items-center gap-2"><span style={{ background: 'var(--color-accent)', borderRadius: '50%', height: '7px', width: '7px' }} />Government</span>
          <span className="flex items-center gap-2"><span style={{ background: 'var(--color-safe)', borderRadius: '50%', height: '7px', width: '7px' }} />First-party</span>
          <span className="flex items-center gap-2"><span style={{ background: 'var(--color-medium)', borderRadius: '50%', height: '7px', width: '7px' }} />Research</span>
          <span className="flex items-center gap-2"><span style={{ borderTop: '2px solid var(--color-text-muted)', width: '18px' }} />Acquired</span>
          <span className="flex items-center gap-2"><span style={{ borderTop: '2px dashed var(--color-text-muted)', width: '18px' }} />Leased</span>
        </div>
      </div>

      <div style={{ background: 'var(--color-page)', height: '720px', minHeight: '720px', overflow: 'auto' }}>
        <svg width={graphData.width} height={graphData.height} className="block" role="img" aria-label="Source provenance nodes arranged by reference depth">
          {columnLabels.map((label, index) => (
            <g key={label}>
              <rect x={index * 320} y={0} width={320} height={52} fill={index % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-2)'} opacity={0.82} />
              <text x={index * 320 + 160} y={31} textAnchor="middle" fill="var(--color-text-2)" fontSize="11" fontWeight="600" letterSpacing="0.5">
                {label.toUpperCase()} · DEPTH {index}
              </text>
              {index > 0 && <line x1={index * 320} y1={52} x2={index * 320} y2={graphData.height} stroke="var(--color-border)" strokeDasharray="3 5" />}
            </g>
          ))}

          {blackboard.reference_edges.map((edge, index) => {
            const fromNode = graphData.nodes.find((node) => node.source_id === edge.from_source_id);
            const toNode = graphData.nodes.find((node) => node.source_id === edge.to_source_id);
            if (!fromNode) return null;

            const targetX = toNode?.x ?? Math.min(graphData.width - 20, fromNode.x + 150);
            const targetY = toNode?.y ?? fromNode.y + ((index % 5) - 2) * 12;
            const connected = hoveredNode === fromNode.source_id || hoveredNode === toNode?.source_id;
            const opacity = hoveredNode ? (connected ? 1 : 0.08) : 0.48;
            const stroke = connected ? 'var(--color-accent-soft)' : 'var(--color-text-muted)';
            const path = `M ${fromNode.x + 106} ${fromNode.y} C ${fromNode.x + 155} ${fromNode.y}, ${targetX - 155} ${targetY}, ${targetX - 106} ${targetY}`;
            const status = edge.original_edge_status || '';

            if (status === 'verified_same_sha256') {
              return (
                <g key={edge.edge_id} opacity={opacity}>
                  <path d={path} fill="none" stroke={stroke} strokeWidth="1" transform="translate(0,-2)" />
                  <path d={path} fill="none" stroke={stroke} strokeWidth="1" transform="translate(0,2)" />
                </g>
              );
            }

            return <path key={edge.edge_id} d={path} fill="none" stroke={stroke} strokeWidth="1.5" strokeDasharray={edgeDash(status)} opacity={opacity} />;
          })}

          {graphData.nodes.map((node) => {
            const connected = blackboard.reference_edges.some((edge) => edge.from_source_id === hoveredNode && edge.to_source_id === node.source_id)
              || blackboard.reference_edges.some((edge) => edge.to_source_id === hoveredNode && edge.from_source_id === node.source_id);
            const active = hoveredNode === node.source_id;
            const opacity = hoveredNode ? (active || connected ? 1 : 0.16) : 1;
            const color = authorityColor(node.authority_class);

            return (
              <g
                key={node.source_id}
                transform={`translate(${node.x},${node.y})`}
                opacity={opacity}
                onClick={() => openDrawer({ id: 'provenance', type: 'provenance', entityId: node.source_id })}
                onMouseEnter={() => setHoveredNode(node.source_id)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ cursor: 'pointer' }}
                tabIndex={0}
                role="button"
                aria-label={`Open provenance for ${node.publisher}`}
              >
                <rect x="-106" y="-31" width="212" height="62" rx="8" fill="var(--color-surface-2)" stroke={color} strokeWidth={active ? 2.5 : 1.5} />
                <circle cx="-91" cy="-15" r="4" fill={node.freshness === 'current' ? 'var(--color-safe)' : 'var(--color-medium)'} />
                <text x="0" y="-12" textAnchor="middle" fill="var(--color-text)" fontSize="11" fontWeight="600">
                  {node.publisher.length > 29 ? `${node.publisher.slice(0, 28)}…` : node.publisher}
                </text>
                <text x="-90" y="9" fill="var(--color-text-muted)" fontSize="9" fontFamily="var(--font-mono)">
                  HTTP {node.http_status} · {node.authority_class.slice(0, 22)}
                </text>
                <text x="-90" y="23" fill="var(--color-text-dim)" fontSize="9" fontFamily="var(--font-mono)">
                  {node.artifactHash ? `sha256 ${node.artifactHash.slice(0, 14)}…` : 'artifact not established'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
