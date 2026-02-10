import type { Episode, MarkerType } from './data';

export interface Arc {
  id: string;
  name: string;
  description: string;
  season: number;
  episodeIds: number[];
  rating?: number;
  mangaChapters?: string;
  image?: string;
}

const MINUTES_PER_EPISODE = 23;
const MINUTES_PER_FILM = 90;
const MINUTES_PER_OVA = 25;

/**
 * Parse the number of individual episodes/items from a display string.
 * "Серии 1-5" → 5, "Серия 26" → 1, "ОВА 1" → 1, "ФИЛЬМ 1" → 1
 */
export function parseEpisodeCount(episodeString: string): number {
  const rangeMatch = episodeString.match(/Серии\s+(\d+)[–-](\d+)/);
  if (rangeMatch) {
    return Number(rangeMatch[2]) - Number(rangeMatch[1]) + 1;
  }
  if (/Серия\s+\d+/.test(episodeString)) return 1;
  if (/ОВА/.test(episodeString)) return 1;
  if (/ФИЛЬМ/.test(episodeString)) return 1;
  return 1;
}

/**
 * Calculate viewing time for a list of episodes.
 * Returns { hours, minutes } of total viewing time.
 */
export function calculateViewingTime(episodes: Episode[]): { hours: number; minutes: number; totalMinutes: number } {
  let totalMinutes = 0;
  for (const ep of episodes) {
    const count = parseEpisodeCount(ep.episodes);
    if (ep.type === 'film') {
      totalMinutes += count * MINUTES_PER_FILM;
    } else if (ep.type === 'ova') {
      totalMinutes += count * MINUTES_PER_OVA;
    } else {
      totalMinutes += count * MINUTES_PER_EPISODE;
    }
  }
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
    totalMinutes,
  };
}

/**
 * Format viewing time as a Russian string like "148ч 30м" or "45м"
 */
export function formatViewingTime(time: { hours: number; minutes: number }): string {
  if (time.hours === 0) return `${time.minutes}м`;
  if (time.minutes === 0) return `${time.hours}ч`;
  return `${time.hours}ч ${time.minutes}м`;
}

/**
 * Build a lookup map from episode ID to its parent Arc.
 */
export function buildEpisodeToArcMap(arcs: Arc[]): Map<number, Arc> {
  const map = new Map<number, Arc>();
  for (const arc of arcs) {
    for (const id of arc.episodeIds) {
      map.set(id, arc);
    }
  }
  return map;
}

/**
 * Get arc progress based on watched set.
 */
export function getArcProgress(arc: Arc, watched: Set<number>): { watched: number; total: number; percentage: number } {
  const total = arc.episodeIds.length;
  let watchedCount = 0;
  for (const id of arc.episodeIds) {
    if (watched.has(id)) watchedCount++;
  }
  return {
    watched: watchedCount,
    total,
    percentage: total > 0 ? Math.round((watchedCount / total) * 100) : 0,
  };
}

/**
 * Get the dominant marker type for an arc (most common marker among its episodes).
 */
export function getArcDominantMarker(arc: Arc, episodes: Episode[]): MarkerType {
  const counts = new Map<MarkerType, number>();
  const episodeMap = new Map(episodes.map(e => [e.id, e]));

  for (const id of arc.episodeIds) {
    const ep = episodeMap.get(id);
    if (ep) {
      counts.set(ep.marker, (counts.get(ep.marker) || 0) + 1);
    }
  }

  let dominant: MarkerType = 'С';
  let maxCount = 0;
  for (const [marker, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      dominant = marker;
    }
  }
  return dominant;
}

/**
 * Get visible episode IDs for an arc given the current set of visible episodes.
 */
export function getArcVisibleEpisodes(arc: Arc, visibleEpisodeIds: Set<number>): number[] {
  return arc.episodeIds.filter(id => visibleEpisodeIds.has(id));
}

/**
 * Group episodes by their arcs, maintaining arc order.
 * Returns arcs that have at least one visible episode, along with their visible episodes.
 */
export function groupEpisodesByArcs(
  arcs: Arc[],
  visibleEpisodes: Episode[],
  season?: number
): { arc: Arc; episodes: Episode[] }[] {
  const visibleIds = new Set(visibleEpisodes.map(e => e.id));
  const episodeMap = new Map(visibleEpisodes.map(e => [e.id, e]));

  const result: { arc: Arc; episodes: Episode[] }[] = [];

  for (const arc of arcs) {
    if (season && arc.season !== season) continue;

    const arcEpisodes: Episode[] = [];
    for (const id of arc.episodeIds) {
      const ep = episodeMap.get(id);
      if (ep && visibleIds.has(id)) {
        arcEpisodes.push(ep);
      }
    }

    if (arcEpisodes.length > 0) {
      result.push({ arc, episodes: arcEpisodes });
    }
  }

  return result;
}
