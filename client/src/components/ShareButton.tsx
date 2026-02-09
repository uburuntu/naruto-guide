import { useState, useCallback, useEffect } from 'react';
import { Share2, Check } from 'lucide-react';
import { generateShareURL } from '@/lib/progress-sharing';

interface ShareButtonProps {
  watched: Set<number>;
}

export function ShareButton({ watched }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const handleShare = useCallback(async () => {
    const url = generateShareURL(watched);
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
  }, [watched]);

  if (watched.size === 0) return null;

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
