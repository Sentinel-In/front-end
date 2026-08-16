import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { sortedCoverage, formatDimension } from '../../selectors/executiveDashboard';
import { useBlackboardStore } from '../../store/useBlackboardStore';

export function CoverageByDimension() {
  const blackboard = useBlackboardStore((state) => state.blackboard);
  if (!blackboard) return null;

  const data = sortedCoverage(blackboard).map(({ dimension, value }) => ({
    name: formatDimension(dimension),
    value,
  }));

  const getColor = (val: number) => {
    if (val >= 90) return 'var(--color-safe)';
    if (val >= 60) return 'var(--color-medium)';
    return 'var(--color-critical)';
  };

  return (
    <div className="card flex flex-col" style={{ minHeight: '340px' }}>
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text)]" style={{ margin: 0 }}>Coverage breakdown</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', margin: '5px 0 18px' }}>Weakest evidence dimension first</p>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 28, left: 22, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11, fill: 'var(--color-text-dim)' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Coverage']}
              contentStyle={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-ctl)' }}
              itemStyle={{ color: 'var(--color-text)' }}
            />
            <Bar dataKey="value" radius={[0, 5, 5, 0]} barSize={12}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
