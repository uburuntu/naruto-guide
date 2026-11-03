import assert from 'node:assert/strict';
import test from 'node:test';
import { buildEpisodeToArcMap, parseEpisodeCount, searchEpisodes } from '../client/src/lib/arc-utils.ts';
import { BORUTO_CONFIG as boruto } from '../client/src/lib/series/boruto.ts';
import { NARUTO_CONFIG as naruto } from '../client/src/lib/series/naruto.ts';

const borutoArcs = buildEpisodeToArcMap(boruto.arcs);

test('episode numbers match the start, middle and end of a range', () => {
  for (const query of ['53', '60', '66', '  СЕРИЯ 60  ']) {
    const hits = searchEpisodes(boruto.episodes, query, borutoArcs);
    assert.deepEqual(hits.map(ep => ep.episodes), ['Серии 53-66']);
  }
  assert.deepEqual(searchEpisodes(boruto.episodes, '294', borutoArcs), []);
});

test('a numeric lookup respects the supplied season and ignores movie and OVA numbers', () => {
  const season = naruto.episodes.filter(ep => ep.season === 2);
  const hits = searchEpisodes(season, '1', buildEpisodeToArcMap(naruto.arcs));
  assert.deepEqual(hits.map(ep => ep.episodes), ['Серии 1-32']);
});

test('text searches still match labels, titles, notes and arc names', () => {
  for (const [query, expectedLabel] of [
    ['Серия 70', 'Серия 70'],
    ['другая сторона', 'Серия 70'],
    ['переделку фильма', 'Серии 53-66'],
    ['филлеры после экзамена', 'Серия 70'],
  ]) {
    assert.ok(searchEpisodes(boruto.episodes, query, borutoArcs).some(ep => ep.episodes === expectedLabel));
  }
  assert.deepEqual(searchEpisodes(boruto.episodes, '   ', borutoArcs), boruto.episodes);
});

test('an en dash range works for both counting and searching', () => {
  const episode = { ...boruto.episodes[0], episodes: 'Серии 2–15' };
  assert.equal(parseEpisodeCount(episode.episodes), 14);
  assert.deepEqual(searchEpisodes([episode], '14', borutoArcs), [episode]);
});
