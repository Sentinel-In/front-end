import { useState, useEffect } from 'react';
import { useBlackboardStore } from '../../store/useBlackboardStore';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export function VersionBanner() {
  const bb = useBlackboardStore(s => s.blackboard);
  const [isStale, setIsStale] = useState(false);
  const [newVersion, setNewVersion] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Mock checking for stale data
  useEffect(() => {
    if (!bb) return;
    
    // Simulate a background update after 30 seconds
    const timer = setTimeout(() => {
      setIsStale(true);
      setNewVersion(bb.audit.head_version + 1);
    }, 30000); // Only for demo

    return () => clearTimeout(timer);
  }, [bb]);

  if (!isStale || dismissed || !newVersion) return null;

  const handleReview = () => {
    // In a real app, this would load the new version and show a diff modal.
    // For the demo, we just dismiss and push a toast.
    useAppStore.getState().pushToast({ message: `Loaded v${newVersion} differences`, type: 'info', duration: 3000 });
    setDismissed(true);
  };

  return (
    <div style={{ 
      background: 'color-mix(in srgb, var(--color-accent) 10%, transparent)',
      borderBottom: '1px solid var(--color-accent)',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px'
    }}>
      <div className="flex items-center gap-2">
        <AlertCircle size={16} style={{ color: 'var(--color-accent)' }} />
        <span style={{ fontSize: '13px', color: 'var(--color-text)', fontWeight: 500 }}>
          Blackboard advanced to v{newVersion} while you were reading.
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={handleReview}
          style={{ 
            background: 'var(--color-accent)', 
            color: 'white', 
            border: 'none', 
            padding: '6px 12px', 
            borderRadius: '4px', 
            fontSize: '12px', 
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={12} />
          Review changes
        </button>
        <button 
          onClick={() => setDismissed(true)}
          style={{ 
            background: 'transparent', 
            color: 'var(--color-text-muted)', 
            border: '1px solid var(--color-border)', 
            padding: '6px 12px', 
            borderRadius: '4px', 
            fontSize: '12px', 
            cursor: 'pointer'
          }}
        >
          Keep v{bb ? bb.audit.head_version : ''}
        </button>
        <button 
          onClick={() => setDismissed(true)}
          style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
