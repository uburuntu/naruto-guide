/**
 * StatsPanel — статистика по типам серий
 */
import { type Episode, MARKERS, type MarkerType } from '@/lib/data';
import { Tv, Film, Clapperboard } from 'lucide-react';

interface StatsPanelProps {
  filteredEpisodes: Episode[];
  watchedCount: number;
}

export function StatsPanel({ filteredEpisodes, watchedCount }: StatsPanelProps) {
  const total = filteredEpisodes.length;
  const series = filteredEpisodes.filter(e => e.type === 'series').length;
  const films = filteredEpisodes.filter(e => e.type === 'film').length;
  const ovas = filteredEpisodes.filter(e => e.type === 'ova').length;

  // Count by marker type
  const markerCounts: Partial<Record<MarkerType, number>> = {};
  for (const ep of filteredEpisodes) {
    markerCounts[ep.marker] = (markerCounts[ep.marker] || 0) + 1;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="bg-card/40 border border-border/50 rounded-lg p-3 text-center">
        <div className="text-2xl font-display font-bold text-primary">{total}</div>
        <div className="text-xs text-muted-foreground mt-1">Всего записей</div>
      </div>
      <div className="bg-card/40 border border-border/50 rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Tv className="w-4 h-4 text-accent" />
          <span className="text-2xl font-display font-bold text-foreground">{series}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">Серии</div>
      </div>
      <div className="bg-card/40 border border-border/50 rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Film className="w-4 h-4 text-accent" />
          <span className="text-2xl font-display font-bold text-foreground">{films}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">Фильмы</div>
      </div>
      <div className="bg-card/40 border border-border/50 rounded-lg p-3 text-center">
        <div className="flex items-center justify-center gap-1.5">
          <Clapperboard className="w-4 h-4 text-accent" />
          <span className="text-2xl font-display font-bold text-foreground">{ovas}</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">ОВА</div>
      </div>
    </div>
  );
}
