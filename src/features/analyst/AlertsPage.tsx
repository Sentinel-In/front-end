import { useMemo } from 'react';
import { useBlackboardStore } from '../../store/useBlackboardStore';
import { useNotificationStore } from '../../store/useNotificationStore';
import { EmptyState, DataTable } from '../../components/primitives';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface AlertItem {
  id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  severityWeight: number;
  timestamp: number;
  title: string;
  source: string;
  onAction: () => void;
}

export function AlertsPage() {
  const blackboard = useBlackboardStore((state) => state.blackboard);
  const notifications = useNotificationStore((state) => state.notifications);
  const navigate = useNavigate();

  const alerts = useMemo(() => {
    const items: AlertItem[] = [];

    // 1. Frontier alerts (blocked or high-priority)
    if (blackboard) {
      blackboard.frontier.forEach((node) => {
        if (node.status === 'blocked' || node.priority === 'required') {
          let severity: AlertItem['severity'] = 'Medium';
          let weight = 2;
          if (node.priority === 'required') { severity = 'Critical'; weight = 4; }
          else if (node.priority === 'high') { severity = 'High'; weight = 3; }
          else if (node.status === 'blocked') { severity = 'High'; weight = 3; }

          items.push({
            id: node.frontier_id,
            severity,
            severityWeight: weight,
            timestamp: new Date(blackboard.case.updated_at).getTime(), // proxy
            title: `Frontier Blocked: ${node.reason || 'Acquisition failed'}`,
            source: 'Graph Frontier',
            onAction: () => {
              navigate(`/evidence/${blackboard.case.case_id}`);
            },
          });
        }
      });
    }

    // 2. Notification alerts
    notifications.forEach((n) => {
      if (n.trigger === 'analyst_returned' || n.trigger === 'reinvocation_complete') {
        items.push({
          id: n.notification_id,
          severity: 'High',
          severityWeight: 3,
          timestamp: new Date(n.created_at).getTime(),
          title: n.title,
          source: 'Workflow System',
          onAction: () => {
            navigate(n.route);
          },
        });
      }
    });

    // Sort by severity (desc), then timestamp (desc)
    return items.sort((a, b) => {
      if (b.severityWeight !== a.severityWeight) {
        return b.severityWeight - a.severityWeight;
      }
      return b.timestamp - a.timestamp;
    });
  }, [blackboard, notifications, navigate]);

  if (alerts.length === 0) {
    return (
      <div className="p-8 max-w-[1200px] mx-auto h-full flex flex-col justify-center">
        <EmptyState
          icon={<AlertCircle size={48} style={{ color: 'var(--color-safe)' }} />}
          title="No Active Alerts"
          body="Your inbox is clear. All automated reinvocations and frontier acquisitions are operating normally."
        />
      </div>
    );
  }

  const columns = [
    { 
      key: 'severity', 
      label: 'Severity',
      width: '120px',
      render: (r: AlertItem) => {
        let color = 'var(--color-text-dim)';
        if (r.severity === 'Critical') color = 'var(--color-critical)';
        else if (r.severity === 'High') color = 'var(--color-warning)';
        else if (r.severity === 'Medium') color = 'var(--color-info)';

        return (
          <span style={{ color, fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>
            {r.severity}
          </span>
        );
      }
    },
    { 
      key: 'source', 
      label: 'Source',
      width: '160px',
      render: (r: AlertItem) => (
        <span style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>
          {r.source}
        </span>
      )
    },
    { 
      key: 'title', 
      label: 'Alert Description',
      render: (r: AlertItem) => (
        <span style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: 500 }}>
          {r.title}
        </span>
      )
    },
    { 
      key: 'timestamp', 
      label: 'Time',
      width: '180px',
      render: (r: AlertItem) => (
        <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          {new Date(r.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </span>
      )
    },
    {
      key: 'action',
      label: '',
      width: '140px',
      render: (r: AlertItem) => (
        <button 
          onClick={r.onAction}
          className="btn btn-secondary flex items-center justify-center gap-2 w-full text-xs"
        >
          View Context <ArrowRight size={12} />
        </button>
      )
    }
  ];

  return (
    <div className="p-8 max-w-[1200px] mx-auto h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text)] mb-2">Analyst Alerts</h1>
        <p className="text-sm text-[var(--color-text-dim)]">Review high-priority workflow interruptions and acquisition blockers.</p>
      </div>

      <div className="card !p-0 overflow-hidden flex-1 flex flex-col">
        <DataTable
          columns={columns}
          data={alerts}
          rowKey={(r) => r.id}
        />
      </div>
    </div>
  );
}
