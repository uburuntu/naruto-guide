/**
 * StatsPanel — статистика по типам серий и время просмотра
 */
import type { Episode } from '@/lib/data';
import { parseEpisodeCount, calculateViewingTime, formatViewingTime } from '@/lib/arc-utils';
import { Tv, Film, Clapperboard, Clock } from 'lucide-react';

interface StatsPanelProps {
  filteredEpisodes: Episode[];
  watchedCount: number;
}

function countEpisodes(episodes: Episode[], type?: Episode['type']): number {
  const filtered = type ? episodes.filter(e => e.type === type) : episodes;
  return filtered.reduce((sum, e) => sum + parseEpisodeCount(e.episodes), 0);
}

const cardClass = "bg-card/40 border border-border/50 rounded-lg p-3 flex flex-col items-center justify-center text-center";

export function StatsPanel({ filteredEpisodes, watchedCount }: StatsPanelProps) {
  const total = countEpisodes(filteredEpisodes);
  const series = countEpisodes(filteredEpisodes, 'series');
  const films = countEpisodes(filteredEpisodes, 'film');
  const ovas = countEpisodes(filteredEpisodes, 'ova');
  const viewingTime = calculateViewingTime(filteredEpisodes);

  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      <div className={cardClass}>
        <div className="text-2xl font-display font-bold text-primary">{total}</div>
        <div className="text-xs text-muted-foreground mt-1">Всего</div>
      </div>
      <div className={cardClass}>
        <div className="flex items-center justify-center gap-1.5">
          <Tv className="w-4 h-4 text-accent" />
          <span className="text-2xl font-display font-bold text-foreground">{series}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">Серии</div>
      </div>
      <div className={cardClass}>
        <div className="flex items-center justify-center gap-1.5">
          <Film className="w-4 h-4 text-accent" />
          <span className="text-2xl font-display font-bold text-foreground">{films}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">Фильмы</div>
      </div>
      <div className={cardClass}>
        <div className="flex items-center justify-center gap-1.5">
          <Clapperboard className="w-4 h-4 text-accent" />
          <span className="text-2xl font-display font-bold text-foreground">{ovas}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">ОВА</div>
      </div>
      <div className={cardClass}>
        <div className="flex items-center justify-center gap-1.5">
          <Clock className="w-4 h-4 text-accent shrink-0" />
          <span className="text-base sm:text-2xl font-display font-bold text-foreground whitespace-nowrap">~{formatViewingTime(viewingTime)}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">Время просмотра</div>
      </div>
    </div>
  );
}
