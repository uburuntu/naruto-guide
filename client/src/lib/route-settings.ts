import type { SeriesConfig } from './series-config';
import { defaultOptions, extraChoices, type RouteOptions } from './watch-route.ts';

export interface RouteSettings extends RouteOptions { mode: string }

export function readSettings(config: SeriesConfig): RouteSettings {
  const params = new URLSearchParams(window.location.search);
  let saved: Partial<RouteSettings> = {};
  try { saved = JSON.parse(localStorage.getItem(config.id + '-route') ?? '{}') ?? {}; } catch {}
  const explicit = params.has('mode') || params.has('extras') || params.has('recaps');
  const requested = explicit ? params.get('mode') : saved.mode;
  const extras = explicit ? params.get('extras')?.split(',') : saved.extras;
  return {
    mode: config.watchModes.find(mode => mode.id === requested)?.id ?? config.defaultModeId,
    extras: Array.isArray(extras) ? extraChoices.filter(choice => extras.includes(choice.id)).map(choice => choice.id) : defaultOptions.extras,
    recaps: explicit ? params.get('recaps') === '1' : saved.recaps === true,
  };
}

export function setRouteParams(url: URL, settings: RouteSettings) {
  url.searchParams.set('mode', settings.mode);
  if (settings.mode === 'speedrun' && settings.extras.length) url.searchParams.set('extras', settings.extras.join(','));
  else url.searchParams.delete('extras');
  if (settings.mode === 'survival' && settings.recaps) url.searchParams.set('recaps', '1');
  else url.searchParams.delete('recaps');
}
