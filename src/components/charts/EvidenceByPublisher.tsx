import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { ROUTES, withCaseId } from '../../routes';
import { useBlackboardStore } from '../../store/useBlackboardStore';

type AuthorityGroup = 'Government' | 'First-party vendor' | 'Research' | 'Secondary';

function authorityGroup(authorityClass: string): AuthorityGroup {
  const normalized = authorityClass.toLowerCase();
  if (normalized.includes('government')) return 'Government';
  if (normalized.includes('first_party')) return 'First-party vendor';
  if (normalized.includes('research')) return 'Research';
  return 'Secondary';
}

function authorityColor(group: AuthorityGroup): string {
  if (group === 'Government') return 'var(--color-accent)';
  if (group === 'First-party vendor') return 'var(--color-safe)';
  if (group === 'Research') return 'var(--color-medium)';
  return 'var(--color-text-muted)';
}

function publisherLabel(publisher: string): string {
  if (publisher === 'FBI Internet Crime Complaint Center') return 'FBI IC3';
  if (publisher === 'CISA, NSA, FBI, and MS-ISAC') return 'CISA / NSA / FBI / MS-ISAC';
  if (publisher === 'Microsoft Defender Security Research Team') return 'MS Defender Research';
  return publisher;
}

export function EvidenceByPublisher() {
  const blackboard = useBlackboardStore((state) => state.blackboard);
  const navigate = useNavigate();
  if (!blackboard) return null;

  const publisherCounts = new Map<string, { count: number; group: AuthorityGroup }>();
  blackboard.sources.forEach((source) => {
    const current = publisherCounts.get(source.publisher);
    publisherCounts.set(source.publisher, {
      count: (current?.count ?? 0) + 1,
      group: current?.group ?? authorityGroup(source.authority_class),
    });
  });

  const data = [...publisherCounts.entries()]
    .map(([publisher, value]) => ({
      publisher,
      name: publisherLabel(publisher),
      value: value.count,
      group: value.group,
    }))
    .sort((a, b) => b.value - a.value || a.publisher.localeCompare(b.publisher));

  const groups: AuthorityGroup[] = ['Government', 'First-party vendor', 'Research', 'Secondary'];

  return (
    <section className="card flex flex-col" style={{ minHeight: '390px' }}>
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text)]" style={{ margin: 0 }}>Evidence by publisher</h3>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '12px', margin: '5px 0 0' }}>24 collected sources, grouped by publisher and authority class</p>
      </div>
      <div style={{ flex: 1, minHeight: '270px', marginTop: '16px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 38, left: 8, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke="var(--color-border)" strokeDasharray="3 3" />
            <XAxis allowDecimals={false} domain={[0, 15]} type="number" tick={{ fontSize: 11, fill: 'var(--color-text-dim)' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" width={176} interval={0} tick={{ fontSize: 11, fill: 'var(--color-text-2)' }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: 'var(--color-surface-2)' }}
              formatter={(value) => [`${value} sources`, 'Collected']}
              labelFormatter={(_, payload) => payload[0]?.payload.publisher ?? ''}
              contentStyle={{ backgroundColor: 'var(--color-surface-2)', border: '1px solid var(--color-border-2)', borderRadius: 'var(--radius-ctl)' }}
              itemStyle={{ color: 'var(--color-text)' }}
            />
            <Bar
              dataKey="value"
              radius={[0, 5, 5, 0]}
              barSize={17}
              minPointSize={4}
              onClick={(entry) => {
                const publisher = (entry as unknown as { payload: { publisher: string } }).payload.publisher;
                navigate(`${withCaseId(ROUTES.evidenceCase, blackboard.case.case_id)}?publisher=${encodeURIComponent(publisher)}`);
              }}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry) => <Cell key={entry.publisher} fill={authorityColor(entry.group)} />)}
              <LabelList dataKey="value" position="right" fill="var(--color-text-2)" fontSize={11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Authority class legend" style={{ borderTop: '1px solid var(--color-border)', paddingTop: '13px' }}>
        {groups.map((group) => (
          <span className="flex items-center gap-2" key={group} style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>
            <span style={{ background: authorityColor(group), borderRadius: 'var(--radius-pill)', height: '8px', width: '8px' }} />
            {group}
          </span>
        ))}
      </div>
    </section>
  );
}
