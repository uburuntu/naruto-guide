import { useState, useCallback } from 'react';

const STORAGE_KEY = 'naruto-spoiler-mode';

export function useSpoilerMode() {
  const [spoilersHidden, setSpoilersHidden] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return { spoilersHidden, toggleSpoilers };
}
