import type { Episode, WatchMode } from './data';
import type { Arc } from './arc-utils';

export type SeriesId = 'naruto' | 'boruto';

export interface SeasonDefinition {
  id: number;
  name: string;
  subtitle: string;
  image?: string;
}

export interface SeriesHero {
  badgeText: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  patternImage?: string;
  ctaText: string;
}

export interface SeriesConfig {
  id: SeriesId;
  name: string;
  fullTitle: string;
  stickyHeaderTitle: string;
  hero: SeriesHero;
  episodes: Episode[];
  arcs: Arc[];
  watchModes: WatchMode[];
  defaultModeId: string;
  seasons: SeasonDefinition[];
  sourceUrl: string;
  sourceAuthor: string;
  storageKeys: {
    watched: string;
    collapsedArcs: string;
    spoilerMode: string;
  };
  maxEpisodeId: number;
  progressUrlParam: string;
  seriesUrlParam: string;
  progressBarLabel: string;
}

export const SERIES_LIST: { id: SeriesId; label: string }[] = [
  { id: 'naruto', label: 'Наруто' },
  { id: 'boruto', label: 'Боруто' },
];

export const DEFAULT_SERIES: SeriesId = 'naruto';

export function getSeriesFromURL(): SeriesId {
  const params = new URLSearchParams(window.location.search);
  const s = params.get('s');
  if (s === 'boruto') return 'boruto';
  if (params.get('bp')) return 'boruto';
  return 'naruto';
}
