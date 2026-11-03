import assert from 'node:assert/strict';
import test from 'node:test';
import { clearProgressFromURL, generateShareURL, getProgressFromURL } from '../client/src/lib/progress-sharing.ts';
import { encodeWatchProgress, decodeWatchProgress } from '../client/src/lib/watch-progress.ts';
import { getSeriesFromURL } from '../client/src/lib/series-config.ts';
import { BORUTO_CONFIG as boruto } from '../client/src/lib/series/boruto.ts';
import { NARUTO_CONFIG as naruto } from '../client/src/lib/series/naruto.ts';

function openPage(t, path) {
  globalThis.window = {
    location: new URL(path, 'https://guide.example'),
    history: {
      replaceState(_state, _title, url) { window.location = new URL(url, window.location); },
    },
  };
  t.after(() => { delete globalThis.window; });
}

for (const config of [naruto, boruto]) {
  test(`${config.name} share links open the right guide with or without progress`, t => {
    openPage(t, '/guide/?s=boruto&mode=full#old');
    for (const watched of [new Set(), new Set(['1s1', '1s17'])]) {
      const { progressUrlParam, seriesUrlParam } = config;
      window.location = new URL(generateShareURL(watched.size ? encodeWatchProgress(watched) : null, progressUrlParam, seriesUrlParam));
      assert.equal(getSeriesFromURL(), config.id);
      assert.equal(window.location.pathname, '/guide/');
      const encoded = getProgressFromURL(progressUrlParam);
      if (watched.size) assert.deepEqual(decodeWatchProgress(encoded, config), watched);
      else assert.equal(encoded, null);

      clearProgressFromURL(progressUrlParam, seriesUrlParam);
      assert.equal(getProgressFromURL(progressUrlParam), null);
      assert.equal(getSeriesFromURL(), config.id);
    }
  });
}

test('consuming a bp-only link keeps Boruto, other parameters and the anchor', t => {
  openPage(t, '/?bp=AQ&mode=full#arc-kawaki');
  assert.equal(getSeriesFromURL(), 'boruto');
  clearProgressFromURL('bp', 'boruto');
  assert.equal(getSeriesFromURL(), 'boruto');
  assert.equal(window.location.searchParams.get('mode'), 'full');
  assert.equal(window.location.hash, '#arc-kawaki');
  assert.equal(getProgressFromURL('bp'), null);
});
