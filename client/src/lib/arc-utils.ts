import type { Episode, MarkerType } from './data';

export interface Arc {
  id: string;
  name: string;
  description?: string;
  season: number;
  episodeIds: number[];
  rating?: number;
  mangaChapters?: string;
  image?: string;
}

const MINUTES_PER_EPISODE = 23;
const MINUTES_PER_FILM = 90;
const MINUTES_PER_OVA = 25;

export function getEpisodeRange(label: string): [number, number] | undefined {
  const match = /^Сери[яи]\s+(\d+)(?:\s*[–-]\s*(\d+))?$/i.exec(label);
  if (match) return [Number(match[1]), Number(match[2] ?? match[1])];
}

/**
 * Parse the number of individual episodes/items from a display string.
 * "Серии 1-5" → 5, "Серия 26" → 1, "ОВА 1" → 1, "ФИЛЬМ 1" → 1
 */
export function parseEpisodeCount(episodeString: string): number {
  const range = getEpisodeRange(episodeString);
  return range ? range[1] - range[0] + 1 : 1;
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

export function searchEpisodes<T extends Episode>(episodes: T[], query: string, episodeToArc: Map<number, Arc>): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return episodes;

  const numberMatch = /^(?:сери[яи]\s+)?(\d+)$/.exec(q);
  if (numberMatch) {
    const number = Number(numberMatch[1]);
    return episodes.filter(ep => {
      const range = getEpisodeRange(ep.episodes);
      return range && range[0] <= number && number <= range[1];
    });
  }

  return episodes.filter(ep =>
    [ep.title, ep.episodes, ep.note, episodeToArc.get(ep.id)?.name]
      .some(text => text?.toLowerCase().includes(q))
  );
}
