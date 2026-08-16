import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Clock } from 'lucide-react';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useRoleStore } from '../../store/useRoleStore';
import { selectNotificationsForRole } from '../../selectors/rbac';
import { Link } from 'react-router-dom';

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifications = useNotificationStore(s => s.notifications);
  const markAsRead = useNotificationStore(s => s.markAsRead);
  const markAllAsRead = useNotificationStore(s => s.markAllAsRead);
  const currentRole = useRoleStore(s => s.role);

  // Filter to notifications targeting the current role, or showing all for demo clarity?
  // Spec: "Toast fires only when the notification targets the currently active role" - but for dropdown, maybe show role-specific.
  // Actually, usually dropdown shows notifications for the current user/role.
  const roleNotifications = selectNotificationsForRole(notifications, currentRole);
  const unreadCount = roleNotifications.filter(n => !n.read_at).length;
  const topTen = roleNotifications.slice(0, 10);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ background: 'transparent', border: 'none', padding: '8px', cursor: 'pointer', position: 'relative', color: 'var(--color-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'var(--color-critical)', color: 'white', fontSize: '10px', fontWeight: 600, padding: '2px 4px', borderRadius: '10px', minWidth: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', right: 0, width: '360px', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 100, marginTop: '8px', overflow: 'hidden' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface-2)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={() => markAllAsRead()} style={{ background: 'transparent', border: 'none', fontSize: '12px', color: 'var(--color-accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {topTen.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-dim)', fontSize: '13px' }}>
                No notifications for {currentRole}.
              </div>
            ) : (
              topTen.map(notif => (
                <div key={notif.notification_id} style={{ borderBottom: '1px solid var(--color-border)', background: notif.read_at ? 'var(--color-surface)' : 'color-mix(in srgb, var(--color-accent) 5%, transparent)', opacity: notif.read_at ? 0.7 : 1 }}>
                  <Link 
                    to={notif.route || '#'} 
                    onClick={() => { markAsRead(notif.notification_id); setIsOpen(false); }}
                    style={{ padding: '16px', display: 'block', textDecoration: 'none' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>{notif.title}</span>
                      <span style={{ fontSize: '10px', color: 'var(--color-text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10} /> {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', lineHeight: 1.4, marginBottom: '8px' }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}>
                      {notif.case_id}
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
