import { NARUTO_CONFIG } from './series/naruto';
import { BORUTO_CONFIG } from './series/boruto';
import type { SeriesConfig, SeriesId } from './series-config';

const SERIES_CONFIGS: Record<SeriesId, SeriesConfig> = {
  naruto: NARUTO_CONFIG,
  boruto: BORUTO_CONFIG,
};

export function getSeriesConfig(id: SeriesId): SeriesConfig {
  return SERIES_CONFIGS[id];
}
