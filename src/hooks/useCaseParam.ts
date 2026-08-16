import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useCaseIndexStore } from '../store/useCaseIndexStore';
import { useBlackboardStore } from '../store/useBlackboardStore';

export function useCaseParam(preferredFallback?: string): string {
  const { caseId } = useParams<{ caseId: string }>();
  const indexFallback = useCaseIndexStore(s => s.cases[0]?.case_id);
  const resolved = caseId ?? preferredFallback ?? indexFallback;
  const load = useBlackboardStore(s => s.load);
  
  useEffect(() => {
    if (resolved) {
      load(resolved);
    }
  }, [resolved, load]);
  
  return resolved;
}
