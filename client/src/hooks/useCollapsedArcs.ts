import { useState, useCallback } from 'react';

const STORAGE_KEY = 'naruto-collapsed-arcs';

function loadCollapsed(): Set<string> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return new Set(JSON.parse(saved) as string[]);
  } catch {}
  return new Set();
}

function saveCollapsed(collapsed: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...collapsed]));
  } catch {}
}

export function useCollapsedArcs() {
  const [collapsed, setCollapsed] = useState<Set<string>>(loadCollapsed);

  const toggleArc = useCallback((arcId: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(arcId)) {
        next.delete(arcId);
      } else {
        next.add(arcId);
      }
      saveCollapsed(next);
      return next;
    });
  }, []);

  const isCollapsed = useCallback((arcId: string) => collapsed.has(arcId), [collapsed]);

  const expandAll = useCallback(() => {
    setCollapsed(new Set());
    saveCollapsed(new Set());
  }, []);

  return { collapsed, toggleArc, isCollapsed, expandAll };
}
