import { legacyRows } from './legacy-progress.ts';
import type { SeriesConfig } from './series-config';
import { decodeProgress } from './progress-sharing.ts';
import { itemKey, numbersFor } from './watch-route.ts';

function expandRange(token: string): string[] {
  const match = /^([1-9]\d?[sefo])([1-9]\d{0,3})(?:-([1-9]\d{0,3}))?$/.exec(token);
  if (!match) return [];
  const first = Number(match[2]), last = Number(match[3] ?? first);
  if (last < first || last - first > 2000) return [];
  return Array.from({ length: last - first + 1 }, (_, i) => match[1] + (first + i));
}

export function migrateRows(config: SeriesConfig, ids: Iterable<number>) {
  const snapshot = legacyRows[config.id];
  const keys = new Set<string>();
  for (const id of ids) {
    if (!Number.isInteger(id) || id < 1 || id > snapshot.length) continue;
    for (const key of expandRange(snapshot[id - 1])) keys.add(key);
  }
  return keys;
}

function validKeys(config: SeriesConfig) {
  const allowed = new Set<string>();
  for (const row of config.episodes) {
    const [first, last] = numbersFor(row);
    for (let n = first; n <= last; n++) {
      const key = itemKey(row, n);
      allowed.add(key);
      if (row.parts?.scenes?.includes(n)) allowed.add(key.replace('s', 'e'));
    }
  }
  return allowed;
}

const keyOrder = new Intl.Collator('en', { numeric: true });

export function encodeWatchProgress(keys: Set<string>) {
  const sorted = [...keys].sort(keyOrder.compare);
  const tokens: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const first = sorted[i];
    const [, prefix, value] = /^(\d+[sefo])(\d+)$/.exec(first)!;
    let last = Number(value);
    while (sorted[i + 1] === prefix + (last + 1)) { i++; last++; }
    tokens.push(first + (last === Number(value) ? '' : '-' + last));
  }
  return 'v2.' + tokens.join('.');
}

export function decodeWatchProgress(value: string, config: SeriesConfig): Set<string> {
  if (value.length > 20000) return new Set();
  if (!value.startsWith('v2.')) {
    return migrateRows(config, decodeProgress(value, legacyRows[config.id].length));
  }
  const allowed = validKeys(config);
  const keys = new Set<string>();
  for (const token of value.slice(3).split('.')) {
    const range = expandRange(token);
    if (!range.length || range.some(key => !allowed.has(key))) return new Set();
    for (const key of range) keys.add(key);
  }
  return keys;
}

export function loadWatchProgress(config: SeriesConfig): Set<string> {
  try {
    const key = config.storageKeys.watched;
    const saved = localStorage.getItem(key + '-v2');
    if (saved !== null) return decodeWatchProgress(saved, config);
    const old = JSON.parse(localStorage.getItem(key) ?? '[]');
    if (Array.isArray(old)) return migrateRows(config, old);
  } catch { /* Storage can be disabled. */ }
  return new Set();
}
