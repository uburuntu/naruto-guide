import { useState, useCallback } from 'react';

export function useSpoilerMode(storageKey: string) {
  const [spoilersHidden, setSpoilersHidden] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      // По умолчанию спойлеры скрыты (true) для новых пользователей
      if (saved === null) return true;
      return JSON.parse(saved) as boolean;
    } catch {
      return true;
    }
  });

  const toggleSpoilers = useCallback(() => {
    setSpoilersHidden(prev => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, [storageKey]);

  return { spoilersHidden, toggleSpoilers };
}
