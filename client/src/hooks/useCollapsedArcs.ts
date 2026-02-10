import { useState, useCallback } from 'react';

function loadCollapsed(storageKey: string): Set<string> {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) return new Set(JSON.parse(saved) as string[]);
  } catch {}
  return new Set();
}

function saveCollapsed(storageKey: string, collapsed: Set<string>) {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...collapsed]));
  } catch {}
}

export function useCollapsedArcs(storageKey: string) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => loadCollapsed(storageKey));

  const toggleArc = useCallback((arcId: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(arcId)) {
        next.delete(arcId);
      } else {
        next.add(arcId);
      }
      saveCollapsed(storageKey, next);
      return next;
    });
  }, [storageKey]);

  const isCollapsed = useCallback((arcId: string) => collapsed.has(arcId), [collapsed]);

  const expandAll = useCallback(() => {
    setCollapsed(new Set());
    saveCollapsed(storageKey, new Set());
  }, [storageKey]);

  return { collapsed, toggleArc, isCollapsed, expandAll };
}
