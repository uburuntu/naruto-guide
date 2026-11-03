import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { NARUTO_CONFIG as naruto } from '../client/src/lib/series/naruto.ts';
import { BORUTO_CONFIG as boruto } from '../client/src/lib/series/boruto.ts';
import { buildRoute, extraChoices, groupRoute, isWatched, markItems, numbersFor, itemKey, routeCounts } from '../client/src/lib/watch-route.ts';
import { buildEpisodeToArcMap } from '../client/src/lib/arc-utils.ts';
import { encodeWatchProgress, decodeWatchProgress, migrateRows, loadWatchProgress } from '../client/src/lib/watch-progress.ts';
import { encodeProgress } from '../client/src/lib/progress-sharing.ts';
import { legacyRows } from '../client/src/lib/legacy-progress.ts';

const route = (id, options) => buildRoute(naruto, naruto.watchModes.find(mode => mode.id === id), options);
const flatten = rows => rows.flatMap(row => row.items);
const keys = rows => flatten(rows).map(item => item.key);

test('catalog source ranges and markers match all reviewed Shikimori rows in order', () => {
  const source = readFileSync(new URL('../reference/shikimori.snapshot', import.meta.url), 'utf8')
    .split('\n').filter(line => /^[12] \|/.test(line)).map(line => line.split(' | ').slice(0, 4));
  const rows = naruto.episodes.map(row => [
    String(row.season), row.type, row.episodes.split(' ')[1], row.marker + (row.tentative ? '?' : ''),
  ]);
  assert.deepEqual(rows, source);
  for (const row of naruto.episodes) {
    if (row.marker.includes('+')) assert.ok(row.parts);
    if (!row.parts) continue;
    const [lo, hi] = numbersFor(row);
    const overrides = Object.values(row.parts).filter(Array.isArray).flat();
    assert.ok(overrides.every(n => Number.isInteger(n) && n >= lo && n <= hi));
    assert.equal(new Set(overrides).size, overrides.length);
  }
});

for (const [config, lengths] of [[naruto, [220, 500]], [boruto, [293]]]) {
  test(`${config.id} catalog covers each episode once; all routes preserve order, counts and ownership`, () => {
    const arcMap = buildEpisodeToArcMap(config.arcs);
    assert.equal(new Set(config.episodes.map(row => row.id)).size, config.episodes.length);
    const owned = config.arcs.flatMap(arc => arc.episodeIds).sort((a, b) => a-b);
    assert.deepEqual(owned, config.episodes.map(row => row.id).sort((a, b) => a-b));
    const catalogKeys = [];
    for (const row of config.episodes) {
      assert.equal(arcMap.get(row.id).season, row.season);
      const [lo, hi] = numbersFor(row);
      for (let n = lo; n <= hi; n++) catalogKeys.push(itemKey(row, n));
    }
    assert.equal(new Set(catalogKeys).size, catalogKeys.length);
    for (const [index, count] of lengths.entries()) {
      const prefix = (index + 1) + 's';
      assert.deepEqual(catalogKeys.filter(key => key.startsWith(prefix)),
        Array.from({length: count}, (_, i) => prefix + (i + 1)));
    }
    for (const mode of config.watchModes) {
      const rows = buildRoute(config, mode);
      const order = keys(rows);
      const selected = new Set(order);
      const expected = catalogKeys.filter(key => selected.has(key));
      if (config === naruto && selected.has('2s271') && selected.has('2f9')) {
        expected.splice(expected.indexOf('2s271'), 1);
        expected.splice(expected.indexOf('2f9') + 1, 0, '2s271');
      }
      assert.deepEqual(order, expected);
      assert.deepEqual(keys(groupRoute(rows, arcMap).flatMap(group => group.episodes)), order);
      assert.equal(Object.values(routeCounts(rows)).reduce((a,b) => a+b, 0), order.length);
    }
  });
}

test('speedrun follows plot instructions, including exceptions on plain filler rows', () => {
  const rows = route('speedrun');
  const items = flatten(rows);
  const keys = new Map(items.map(item => [item.key, item]));
  for (const [lo, hi, expected] of [[54,71,[54,55,56,71]], [89,112,[89,90,112]], [427,428,[427]]]) {
    assert.deepEqual(Array.from({length: hi-lo+1}, (_, i) => lo+i).filter(n => keys.has('2s'+n)), expected);
  }
  assert.equal(keys.get('2s55').scene, false);
  assert.equal(keys.get('2s427').scene, true);
  assert.match(rows.find(row => row.items[0].key === '2s427').instruction, /начале/);
  assert.match(rows.find(row => row.items[0].key === '2s112').instruction, /91–111/);
  assert.equal(items.filter(item => !item.scene).length, 385);
  assert.equal(items.filter(item => item.scene).length, 20);
});

test('each speedrun extra can be selected separately; recaps restore the full catalog', () => {
  for (const option of extraChoices) {
    const items = flatten(route('speedrun', {extras: [option.id], recaps: false}));
    for (let n = option.first; n <= option.last; n++) {
      const key = '2' + (option.type === 'film' ? 'f' : 's') + n;
      assert.equal(items.find(item => item.key === key)?.scene, false);
    }
    assert.equal(items.some(item => item.key === '2f10'), option.id === 'film10');
  }
  assert.deepEqual(routeCounts(route('survival')), {series:714, film:11, ova:13});
  assert.deepEqual(routeCounts(route('survival', {extras:[], recaps:true})), {series:720, film:11, ova:13});
});

test('movie instructions follow the companion episode and the original TV placement', () => {
  const rows = route('golden'), order = keys(rows);
  const i = order.indexOf('2f9');
  assert.deepEqual(order.slice(i-1,i+2), ['2s311','2f9','2s271']);
  assert.match(rows.find(row => row.items[0].key === '2f10').instruction, /479/);
});

test('official Boruto arc boundaries cover all 293 episodes', () => {
  // Inclusive ends of the 21 categories returned by NARUTO OFFICIAL SITE (2026-11-03).
  const ends = [15,24,32,39,50,70,92,105,115,136,156,176,192,205,220,232,260,273,281,286,293];
  const map = buildEpisodeToArcMap(boruto.arcs);
  const groups = groupRoute(buildRoute(boruto, boruto.watchModes.at(-1)), map);
  assert.deepEqual(groups.map(group => flatten(group.episodes).at(-1).number), ends);
  assert.equal(groups[17].arc.name, 'Каваки и Химавари в Академии');
  assert.equal(groups[18].arc.name, 'Игра в лабиринте');
});

test('every old row and bit still selects its original episodes across both catalogs', () => {
  for (const config of [naruto, boruto]) {
    const length = legacyRows[config.id].length;
    for (let id = 1; id <= length; id++) {
      const expected = migrateRows(config, [id]);
      assert.ok(expected.size);
      assert.deepEqual(decodeWatchProgress(encodeProgress(new Set([id]), length), config), expected);
      assert.deepEqual(decodeWatchProgress(encodeWatchProgress(expected), config), expected);
    }
  }
  const old38 = new Set(Array.from({length:6}, (_,i) => '1s'+(256+i)));
  assert.deepEqual(migrateRows(boruto, [38]), old38);
  assert.equal(migrateRows(naruto, [6]).size, 41);
});

test('a plot scene and a full episode have distinct progress across mode changes', () => {
  const partial = {key:'2s427', number:427, scene:true};
  const full = {...partial, scene:false};
  let progress = markItems(new Set(), [partial], true);
  assert.equal(isWatched(progress, full), false);
  assert.equal(isWatched(progress, partial), true);
  progress = decodeWatchProgress(encodeWatchProgress(progress), naruto);
  assert.equal(isWatched(progress, partial), true);
  progress = markItems(progress, [full], true);
  assert.deepEqual(progress, new Set(['2s427']));
  assert.equal(isWatched(progress, partial), true);
  assert.equal(markItems(progress, [full], false).size, 0);
});

test('an empty v2 save takes precedence over old marks and malformed imports are rejected', t => {
  const store = new Map([['naruto-watched','[6]']]);
  globalThis.localStorage = {getItem: key => store.get(key) ?? null};
  t.after(() => { delete globalThis.localStorage; });
  assert.equal(loadWatchProgress(naruto).size, 41);
  store.set('naruto-watched-v2', 'v2.');
  assert.equal(loadWatchProgress(naruto).size, 0);
  for (const input of ['v2.1s5-2', 'v2.2s501', 'v2.1s1.invalid', 'v2.1s99999', 'v3.1s3']) {
    assert.equal(decodeWatchProgress(input,naruto).size, 0);
  }
});
