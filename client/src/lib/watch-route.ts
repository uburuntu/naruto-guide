import type { Episode, MarkerType, WatchMode } from './data';
import type { SeriesConfig } from './series-config';
import { getEpisodeRange, type Arc } from './arc-utils.ts';

export interface RouteOptions {
  extras: string[];
  recaps: boolean;
}
export const defaultOptions: RouteOptions = { extras: [], recaps: false };

export interface Item {
  key: string;
  number: number;
  scene: boolean;
}

export interface RouteRow extends Episode {
  items: Item[];
  instruction: string;
}

export function isWatched(watched: Set<string>, item: Item): boolean {
  return watched.has(item.key) || (item.scene && watched.has(sceneKey(item.key)));
}

export function sceneKey(key: string) {
  return key.replace('s', 'e');
}

export function markItems(watched: Set<string>, items: Item[], checked: boolean): Set<string> {
  const next = new Set(watched);
  for (const item of items) {
    if (!checked) {
      next.delete(item.key);
      next.delete(sceneKey(item.key));
    } else if (item.scene) {
      if (!next.has(item.key)) next.add(sceneKey(item.key));
    } else {
      next.delete(sceneKey(item.key));
      next.add(item.key);
    }
  }
  return next;
}

export function numbersFor(row: Episode): [number, number] {
  if (row.type === 'series') {
    const range = getEpisodeRange(row.episodes);
    if (range) return range;
  } else {
    const match = /^(?:ФИЛЬМ|ОВА)\s+(\d+)$/i.exec(row.episodes);
    if (match) return [Number(match[1]), Number(match[1])];
  }
  throw new Error(`Invalid catalog label: ${row.episodes}`);
}

export function itemKey(row: Episode, number: number) {
  const kind = { series: 's', film: 'f', ova: 'o' }[row.type];
  return `${row.season}${kind}${number}`;
}

export const extraChoices = [
  { id: '368-371', label: 'Серии 368–371', type: 'series', first: 368, last: 371 },
  { id: '418-419', label: 'Серии 418–419', type: 'series', first: 418, last: 419 },
  { id: '451-468', label: 'Серии 451–468', type: 'series', first: 451, last: 468 },
  { id: '494-500', label: 'Серии 494–500', type: 'series', first: 494, last: 500 },
  { id: 'film10', label: 'Фильм №10', type: 'film', first: 10, last: 10 },
];

function speedrunExtra(row: Episode, n: number, extras: string[]) {
  return row.season === 2 && extraChoices.some(choice =>
    extras.includes(choice.id) && row.type === choice.type && n >= choice.first && n <= choice.last);
}

function classify(row: Episode, n: number) {
  const parts = row.parts;
  if (!parts) return { marker: row.marker, scenes: false };
  const filler = (row.marker.split('+')[1] ?? row.marker) as MarkerType;
  if (parts.scenes?.includes(n)) return { marker: filler, scenes: true };
  if (parts.story?.includes(n)) return { marker: 'С' as const, scenes: false };
  if (parts.filler?.includes(n)) return { marker: filler, scenes: false };
  if (parts.inserts?.includes(n)) return { marker: row.marker, scenes: false };
  return { marker: parts.base, scenes: false };
}

function sceneInstruction(row: Episode, n: number) {
  if (row.season === 1 && n === 220) return 'Посмотри вторую половину серии.';
  if (n === 427) return 'Посмотри сюжетную сцену в начале серии.';
  return 'Посмотри сюжетные вставки. Точные таймкоды в источнике не указаны.';
}

export function buildRoute(config: SeriesConfig, mode: WatchMode, options: RouteOptions = defaultOptions): RouteRow[] {
  const rows: RouteRow[] = [];
  let season = 0;
  let lastTV = 0;
  for (const row of config.episodes) {
    if (season !== row.season) { season = row.season; lastTV = 0; }
    const [first, last] = numbersFor(row);
    for (let n = first; n <= last; n++) {
      const { marker, scenes } = classify(row, n);
      const whole = mode.markers.includes(marker) ||
        (mode.id === 'survival' && options.recaps && marker === 'П') ||
        (config.id === 'naruto' && mode.id === 'speedrun' && speedrunExtra(row, n, options.extras));
      if (!whole && !scenes) continue;
      const displayMarker = scenes ? `С+${marker}` as MarkerType : marker;
      const item = { key: itemKey(row, n), number: n, scene: !whole };
      let instruction = item.scene ? sceneInstruction(row, n) : '';
      if (row.type !== 'series') instruction = `После ${lastTV}-й серии сезона ${row.season}.`;
      const prev = rows.at(-1);
      if (prev?.id === row.id && prev.marker === displayMarker && prev.instruction === instruction &&
          prev.items.at(-1)!.number === n - 1) {
        prev.items.push(item);
        prev.episodes = `Серии ${prev.items[0].number}-${n}`;
      } else {
        rows.push({ ...row, marker: displayMarker, instruction, items: [item], episodes: row.type === 'series' ? `Серия ${n}` : row.episodes });
      }
    }
    if (row.type === 'series') lastTV = last;
  }
  let previous: RouteRow | undefined;
  for (const row of rows) {
    if (row.type !== 'series') continue;
    if (previous && previous.season === row.season) {
      const from = previous.items.at(-1)!.number + 1;
      const to = row.items[0].number - 1;
      if (from <= to) {
        const gap = from === to ? `Можно пропустить серию ${from}.` : `Можно пропустить серии ${from}–${to}.`;
        row.instruction = [gap, row.instruction].filter(Boolean).join(' ');
      }
    }
    previous = row;
  }
  // The guide places the companion episode after the film when both are on the route.
  if (config.id === 'naruto') {
    const companion = rows.find(row => row.items[0].key === '2s271');
    const movie = rows.find(row => row.items[0].key === '2f9');
    if (movie && companion) {
      rows.splice(rows.indexOf(companion), 1);
      rows.splice(rows.indexOf(movie) + 1, 0, companion);
      companion.instruction = 'После фильма №9 «Путь ниндзя».';
      movie.instruction = 'После 311-й серии. Затем посмотри отложенную 271-ю серию.';
    }
  }
  return rows;
}

export function groupRoute(rows: RouteRow[], arcMap: Map<number, Arc>) {
  const groups: { id: string; arc: Arc; episodes: RouteRow[] }[] = [];
  const used = new Set<string>();
  for (const row of rows) {
    const arc = arcMap.get(row.id);
    if (!arc) throw new Error(`Missing arc for entry ${row.id}`);
    const prev = groups.at(-1);
    if (prev?.arc === arc) prev.episodes.push(row);
    else {
      const id = used.has(arc.id) ? `${arc.id}-${row.items[0].key}` : arc.id;
      groups.push({ id, arc, episodes: [row] });
      used.add(arc.id);
    }
  }
  return groups;
}

export function routeCounts(rows: RouteRow[]) {
  const counts = { series: 0, film: 0, ova: 0 };
  for (const row of rows) counts[row.type] += row.items.length;
  return counts;
}

export function itemLabel(row: Episode, n: number) {
  if (row.type === 'film') return `Фильм №${n}`;
  if (row.type === 'ova') return `ОВА №${n}`;
  return `Сезон ${row.season} · серия ${n}`;
}

export function routeSummary(rows: RouteRow[]) {
  const { series, film, ova } = routeCounts(rows);
  const scenes = rows.filter(row => row.items[0].scene).reduce((total, row) => total + row.items.length, 0);
  return [scenes ? `Целиком: ${series - scenes}` : `Серии: ${series}`, scenes && `только вставки: ${scenes}`, film && `фильмы: ${film}`, ova && `ОВА: ${ova}`].filter(Boolean).join(' · ');
}
