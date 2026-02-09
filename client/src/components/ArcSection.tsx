import { memo } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { RatingBadge } from '@/components/RatingBadge';
import { EpisodeRow } from '@/components/EpisodeRow';
import { ChevronDown, Clock, BookOpen } from 'lucide-react';
import { type Arc, getArcProgress, calculateViewingTime, formatViewingTime } from '@/lib/arc-utils';
import type { Episode } from '@/lib/data';

interface ArcSectionProps {
  arc: Arc;
  episodes: Episode[];
  watched: Set<number>;
  onToggle: (id: number) => void;
  onBatchToggle: (ids: number[], state: boolean) => void;
  spoilersHidden: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  searchQuery?: string;
}

export const ArcSection = memo(function ArcSection({
  arc,
  episodes,
  watched,
  onToggle,
  onBatchToggle,
  spoilersHidden,
  isCollapsed,
  onToggleCollapse,
}: ArcSectionProps) {
  const progress = getArcProgress(arc, watched);
  const viewingTime = calculateViewingTime(episodes);
  const allWatched = progress.watched === progress.total && progress.total > 0;
  const someWatched = progress.watched > 0 && !allWatched;

  const handleBatchToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const visibleIds = episodes.map(ep => ep.id);
    onBatchToggle(visibleIds, !allWatched);
  };

  return (
    <Collapsible open={!isCollapsed} onOpenChange={() => onToggleCollapse()}>
      <CollapsibleTrigger asChild>
        <div
          id={`arc-${arc.id}`}
          className={`
            group relative flex items-center gap-3 p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200 overflow-hidden
            ${allWatched
              ? 'bg-muted/20 border-border/40 opacity-80'
              : 'bg-card/60 border-border hover:bg-card/80 hover:border-border/80'
            }
          `}
        >
          {/* Arc background image */}
          {arc.image && (
            <>
              <img
                src={arc.image}
                alt=""
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover opacity-15 group-hover:opacity-20 transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/60 to-background/40" />
            </>
          )}
          {/* Batch checkbox */}
          <div className="relative shrink-0" onClick={handleBatchToggle}>
            <Checkbox
              checked={allWatched}
              className={`data-[state=checked]:bg-primary data-[state=checked]:border-primary ${
                someWatched ? 'border-primary/50 bg-primary/20' : ''
              }`}
            />
          </div>

          {/* Arc info */}
          <div className="relative flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={`text-sm sm:text-base font-display font-semibold leading-snug ${
                allWatched ? 'text-muted-foreground line-through' : 'text-foreground'
              }`}>
                {arc.name}
              </h3>
              {arc.rating && <RatingBadge rating={arc.rating} />}
              {arc.mangaChapters && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground/60">
                  <BookOpen className="w-3 h-3" />
                  гл. {arc.mangaChapters}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              <span className="text-xs text-muted-foreground">
                {progress.watched}/{progress.total} записей
              </span>
              <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                ~{formatViewingTime(viewingTime)}
              </span>
              {/* Mini progress bar */}
              <div className="hidden sm:block w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progress.percentage}%`,
                    background: 'linear-gradient(90deg, oklch(0.72 0.19 55), oklch(0.65 0.20 40))',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Collapse chevron */}
          <ChevronDown className={`relative w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${
            !isCollapsed ? 'rotate-180' : ''
          }`} />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-1.5 mt-1.5 pl-2 sm:pl-4 border-l-2 border-border/30 ml-4">
          {episodes.map(episode => (
            <EpisodeRow
              key={episode.id}
              episode={episode}
              isWatched={watched.has(episode.id)}
              onToggle={onToggle}
              isVisible={true}
              spoilersHidden={spoilersHidden}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
});
