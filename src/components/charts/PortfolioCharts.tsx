import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useCaseIndexStore } from '../../store/useCaseIndexStore';

const priorityColor = {
  P0: 'var(--color-critical)',
  P1: 'var(--color-high)',
  P2: 'var(--color-medium)',
  P3: 'var(--color-text-muted)',
} as const;

function titleCase(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function PortfolioCharts() {
  const cases = useCaseIndexStore((state) => state.cases);
  const navigate = useNavigate();

  const phaseOrder = ['discovery', 'expansion', 'reconciliation', 'applicability', 'actionability', 'verification', 'complete', 'blocked'];
  const distData = phaseOrder
    .map((phase) => {
      const phaseCases = cases.filter((item) => item.phase === phase);
      return {
        name: titleCase(phase),
        P0: phaseCases.filter((item) => item.priority === 'P0').length,
        P1: phaseCases.filter((item) => item.priority === 'P1').length,
        P2: phaseCases.filter((item) => item.priority === 'P2').length,
        P3: phaseCases.filter((item) => item.priority === 'P3').length,
      };
    })
    .filter((item) => item.P0 + item.P1 + item.P2 + item.P3 > 0);

  const scatterData = cases.map((item) => ({
    caseId: item.case_id,
    label: item.case_id.slice(-4),
    title: item.title,
    x: item.coverage.composite,
    y: item.applicability.score,
    z: item.assets.affected,
    priority: item.priority,
  }));

  return (
    <section className="grid grid-cols-1 lg:grid-cols-2 gap-[14px]">
      <article className="card flex flex-col" style={{ minHeight: '360px' }}>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)]" style={{ margin: 0 }}>Priority distribution by phase</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', margin: '5px 0 0' }}>Portfolio case count, stacked by derived priority</p>
        </div>
        <div style={{ flex: 1, minHeight: '260px', marginTop: '12px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distData} margin={{ top: 28, right: 14, left: -12, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="name" interval={0} tick={{ fontSize: 11, fill: 'var(--color-text-2)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-text-dim)' }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'var(--color-surface-2)' }}
                contentStyle={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border-2)', borderRadius: 'var(--radius-ctl)' }}
                itemStyle={{ color: 'var(--color-text)' }}
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: '11px', top: 0 }} />
              <Bar dataKey="P0" stackId="priority" fill={priorityColor.P0} radius={[0, 0, 0, 0]} />
              <Bar dataKey="P1" stackId="priority" fill={priorityColor.P1} />
              <Bar dataKey="P2" stackId="priority" fill={priorityColor.P2} />
              <Bar dataKey="P3" stackId="priority" fill={priorityColor.P3} radius={[5, 5, 0, 0]}>
                <LabelList dataKey={(entry: (typeof distData)[number]) => entry.P0 + entry.P1 + entry.P2 + entry.P3} position="top" fill="var(--color-text-2)" fontSize={11} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="card flex flex-col" style={{ minHeight: '360px' }}>
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text)]" style={{ margin: 0 }}>Coverage posture</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', margin: '5px 0 0' }}>Composite evidence coverage versus applicability coverage</p>
        </div>
        <div style={{ flex: 1, minHeight: '260px', marginTop: '12px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 24, right: 28, left: 0, bottom: 22 }}>
              <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" />
              <ReferenceArea y1={0} y2={60} fill="var(--color-critical)" fillOpacity={0.06} />
              <ReferenceLine y={60} stroke="var(--color-critical)" strokeDasharray="5 5" strokeOpacity={0.55} />
              <XAxis type="number" dataKey="x" name="Composite coverage" domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-dim)' }} axisLine={false} tickLine={false} label={{ value: 'Composite coverage', position: 'bottom', offset: 5, fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <YAxis type="number" dataKey="y" name="Applicability coverage" domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} tick={{ fontSize: 11, fill: 'var(--color-text-dim)' }} axisLine={false} tickLine={false} label={{ value: 'Applicability', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--color-text-muted)' }} />
              <ZAxis type="number" dataKey="z" range={[110, 260]} name="Affected assets" />
              <Tooltip
                cursor={{ stroke: 'var(--color-border-2)', strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload as (typeof scatterData)[number];
                  return (
                    <div style={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border-2)', borderRadius: 'var(--radius-ctl)', padding: '10px 12px', fontSize: '12px', maxWidth: '260px' }}>
                      <div style={{ color: 'var(--color-text)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{item.caseId}</div>
                      <div style={{ color: 'var(--color-text-muted)', margin: '4px 0 7px' }}>{item.title}</div>
                      <div style={{ color: priorityColor[item.priority] }}>{item.priority} priority</div>
                      <div style={{ color: 'var(--color-text-2)' }}>Coverage {item.x}% · applicability {item.y}%</div>
                    </div>
                  );
                }}
              />
              <Scatter
                data={scatterData}
                onClick={(entry) => navigate(`/reports/asset-impact/${(entry as unknown as { payload: { caseId: string } }).payload.caseId}`)}
                style={{ cursor: 'pointer' }}
              >
                {scatterData.map((entry) => <Cell key={entry.caseId} fill={priorityColor[entry.priority]} stroke="var(--color-surface)" strokeWidth={2} />)}
                <LabelList dataKey="label" position="top" fill="var(--color-text-2)" fontSize={10} />
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-2" style={{ color: 'var(--color-critical)', fontSize: '11px', marginTop: '2px' }}>
          <span style={{ borderTop: '1px dashed var(--color-critical)', width: '18px' }} /> Below 60: material applicability blind spot
        </div>
      </article>
    </section>
  );
}
