import { useState, useCallback, useEffect } from 'react';
import { Share2, Check } from 'lucide-react';
import { encodeWatchProgress } from '@/lib/watch-progress';
import { generateShareURL } from '@/lib/progress-sharing';

import { setRouteParams, type RouteSettings } from '@/lib/route-settings';

interface ShareButtonProps {
  settings: RouteSettings;
  watched: Set<string>;
  progressParam: string;
  seriesParam: string;
}

export function ShareButton({ watched, progressParam, seriesParam, settings }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleShare = useCallback(async () => {
    const share = new URL(generateShareURL(watched.size ? encodeWatchProgress(watched) : null, progressParam, seriesParam));
    setRouteParams(share, settings);
    const url = share.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
    }
  }, [watched, progressParam, seriesParam, settings]);

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border bg-card/40 hover:bg-card/60 transition-colors text-muted-foreground"
      title="Поделиться прогрессом"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-500" />
          <span className="hidden sm:inline text-green-500">Скопировано!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Поделиться</span>
        </>
      )}
    </button>
  );
}
