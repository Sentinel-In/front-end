/* ============================================================
   useCopyToClipboard — SPEC §6
   Copies text, shows toast, morphs icon for 1.2s.
   ============================================================ */

import { useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);
  const pushToast = useAppStore((s) => s.pushToast);

  const copy = useCallback(async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      pushToast({
        message: `Copied ${label || text}`,
        type: 'success',
        duration: 1500,
      });
      setTimeout(() => setCopied(false), 1200);
    } catch {
      pushToast({
        message: 'Failed to copy to clipboard',
        type: 'error',
        duration: 2000,
      });
    }
  }, [pushToast]);

  return { copied, copy };
}
