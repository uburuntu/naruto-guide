/**
 * EpisodeRow — строка серии/фильма/ОВА в таблице
 * Дизайн: Dark Shinobi Dashboard — тёмные карточки с цветными маркерами и glow-эффектами
 * Поддержка скрытия спойлеров: при spoilersHidden=true названия и примечания размыты
 */
import { memo, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { type Episode, MARKERS, type MarkerType } from '@/lib/data';
import { Film, Tv, Clapperboard, Info, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

import { isWatched, type Item, type RouteRow } from '@/lib/watch-route';

interface EpisodeRowProps {
  episode: RouteRow;
  watched: Set<string>;
  onToggle: (items: Item[], checked: boolean) => void;
  spoilersHidden: boolean;
}

function getTypeIcon(type: Episode['type']) {
  switch (type) {
    case 'film': return <Film className="w-4 h-4" />;
    case 'ova': return <Clapperboard className="w-4 h-4" />;
    default: return <Tv className="w-4 h-4" />;
  }
}

function MarkerBadge({ marker, tentative }: { marker: MarkerType; tentative?: boolean }) {
  const info = MARKERS[marker] || MARKERS['С'];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold font-display tracking-wide shrink-0 border"
          style={{
            color: info.color,
            backgroundColor: info.bgColor,
            borderColor: info.color + '33',
          }}
        >
          {info.label}{tentative ? '?' : ''}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[250px]">
        <p className="text-sm">{info.description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export const EpisodeRow = memo(function EpisodeRow({ episode, watched, onToggle, spoilersHidden }: EpisodeRowProps) {
  const count = episode.items.filter(item => isWatched(watched, item)).length;
  const complete = count === episode.items.length;

  const [revealed, setRevealed] = useState(false);
  const markerInfo = MARKERS[episode.marker] || MARKERS['С'];
  const shouldBlur = spoilersHidden && !revealed && !complete;

  return (
    <motion.div
      id={`row-${episode.items[0].key}`}
      tabIndex={-1}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`
        group relative flex items-start gap-3 p-3 sm:p-4 rounded-lg border transition-all duration-200
        ${complete
          ? 'bg-muted/30 border-border/50 opacity-70'
          : 'bg-card/60 border-border hover:border-border/80 hover:bg-card/80'
        }
      `}
      style={{
        borderLeftWidth: '3px',
        borderLeftColor: markerInfo.color,
      }}
    >
      {/* Checkbox */}
      <div className="pt-0.5 shrink-0">
        <Checkbox
          aria-label={`Просмотрено: ${episode.episodes}`}
          checked={complete || (count ? 'indeterminate' : false)}
          onCheckedChange={() => onToggle(episode.items, !complete)}
          className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <MarkerBadge marker={episode.marker} tentative={episode.tentative} />
          <span className="text-muted-foreground/60">
            {getTypeIcon(episode.type)}
          </span>
          <span className="text-sm font-medium text-muted-foreground">
            {episode.episodes}
          </span>
          {episode.releaseDate && (
            <span className="text-xs text-muted-foreground/50">
              {episode.releaseDate}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <h3
            className={`text-sm sm:text-base font-medium leading-snug transition-all duration-300 ${
              complete ? 'line-through text-muted-foreground' : 'text-foreground'
            } ${shouldBlur ? 'blur-sm select-none' : ''}`}
          >
            {episode.title}
          </h3>
          {shouldBlur && (
            <button
              onClick={() => setRevealed(true)}
              className="shrink-0 p-1 rounded text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
              title="Показать название"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {episode.instruction && <p className="mt-1 text-sm text-primary">{episode.instruction}</p>}
        {episode.items.length > 1 && (
          <details className="mt-2 text-xs text-muted-foreground">
            <summary className="cursor-pointer">По сериям · {count}/{episode.items.length}</summary>
            <div className="mt-2 flex flex-wrap gap-1">
              {episode.items.map(item => (
                <button key={item.key} id={`episode-${item.key}`} type="button" aria-label={`Серия ${item.number}`}
                  aria-pressed={isWatched(watched, item)}
                  onClick={() => onToggle([item], !isWatched(watched, item))}
                  className="px-2 py-1 rounded border border-border aria-pressed:bg-primary aria-pressed:text-primary-foreground">
                  {item.number}
                </button>
              ))}
            </div>
          </details>
        )}
        {episode.note && (
          <div className={`mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground/80 transition-all duration-300 ${shouldBlur ? 'blur-sm select-none' : ''}`}>
            <Info className="w-3.5 h-3.5 shrink-0 text-accent" />
            <span>{episode.note}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
});
