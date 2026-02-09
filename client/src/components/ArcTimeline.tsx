import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { Arc } from '@/lib/arc-utils';
import { getArcProgress, getArcDominantMarker } from '@/lib/arc-utils';
import type { Episode } from '@/lib/data';
import { MARKERS } from '@/lib/data';

interface ArcTimelineProps {
  arcs: Arc[];
  episodes: Episode[];
  watched: Set<number>;
  visibleEpisodeIds: Set<number>;
  onArcClick: (arcId: string) => void;
}

export function ArcTimeline({ arcs, episodes, watched, visibleEpisodeIds, onArcClick }: ArcTimelineProps) {
  const visibleArcs = useMemo(() => {
    return arcs.filter(arc => arc.episodeIds.some(id => visibleEpisodeIds.has(id)));
  }, [arcs, visibleEpisodeIds]);

  const totalEpisodes = useMemo(() => {
    return visibleArcs.reduce((sum, arc) => {
      return sum + arc.episodeIds.filter(id => visibleEpisodeIds.has(id)).length;
    }, 0);
  }, [visibleArcs, visibleEpisodeIds]);

  if (visibleArcs.length === 0) return null;

  return (
    <div className="w-full">
      <h3 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Таймлайн
      </h3>
      <div className="relative flex gap-0.5 h-8 rounded-lg overflow-hidden bg-muted/30 border border-border/50">
        {visibleArcs.map(arc => {
          const visibleCount = arc.episodeIds.filter(id => visibleEpisodeIds.has(id)).length;
          const widthPercent = (visibleCount / totalEpisodes) * 100;
          const progress = getArcProgress(arc, watched);
          const dominant = getArcDominantMarker(arc, episodes);
          const color = MARKERS[dominant]?.color || '#6b7280';

          return (
            <Tooltip key={arc.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onArcClick(arc.id)}
                  className="relative h-full transition-opacity hover:opacity-80"
                  style={{ width: `${Math.max(widthPercent, 1)}%`, minWidth: '4px' }}
                >
                  {/* Background (full bar) */}
                  <div
                    className="absolute inset-0 opacity-30"
                    style={{ backgroundColor: color }}
                  />
                  {/* Watched fill */}
                  <div
                    className="absolute inset-y-0 left-0 transition-all duration-300"
                    style={{
                      width: `${progress.percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[220px]">
                <p className="font-display font-semibold text-sm">{arc.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {progress.watched}/{progress.total} • {arc.rating ? `${arc.rating}/10` : 'Без рейтинга'}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
