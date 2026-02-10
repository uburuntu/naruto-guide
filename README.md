# Naruto & Boruto Guide

Interactive viewing guide for Naruto (720 episodes, 11 films, 13 OVAs) and Boruto: Naruto Next Generations (293 episodes). Based on the [guide by Даинг Окаянный](https://shikimori.one/articles/365-naruto-ultimativnyy-gayd-po-prosmotru) on Shikimori.

## Features

- Series switcher (Naruto / Boruto) on a single page
- 5 viewing modes per series (Speedrun → На выживание)
- Color-coded episode markers (story, filler tiers, recaps, novels)
- Progress tracker with localStorage persistence and shareable URLs
- Arc grouping with timeline, ratings, and manga chapter references
- Spoiler blur toggle, search, PWA install support

## Stack

React, TypeScript, Vite, Tailwind CSS, Framer Motion

## Development

```
pnpm install
pnpm dev
```

## Build

```
pnpm build
```

Output goes to `dist/`. Configured for GitHub Pages with custom domain via `CNAME`.

## Contributing: data edits and new seasons

All series data lives in `client/src/lib/series/`. Each series has its own file (`naruto.ts`, `boruto.ts`) exporting a `SeriesConfig` object that bundles episodes, arcs, watch modes, and metadata.

### Editing episodes

Episodes are in the `EPISODES` array. Each entry groups consecutive episodes of the same type:

```ts
{ id: 14, marker: 'С', episodes: 'Серии 53-66', title: 'Арка Экзамена Чунина', type: 'series', season: 1, releaseDate: '2018', note: 'Манга-адаптация' },
```

- `id` — sequential, unique within the series
- `marker` — classification: `С` (canon), `Ф1`–`Ф4` (filler quality tiers), `ФН` (novel), `П` (recap), or mixed like `С+Ф1`
- `episodes` — display string: `Серии X-Y`, `Серия X`, `ФИЛЬМ X`, or `ОВА X`
- `type` — `'series'`, `'film'`, or `'ova'`
- `season` — numeric (1, 2, etc.)
- `releaseDate` — year string like `'2023'`
- `note` — optional, explains mixed-marker entries or context

### Adding a new season (e.g. Boruto: Two Blue Vortex)

1. Add new episodes to the `EPISODES` array with the next sequential `id` values and `season: 2`
2. Add new arcs to the `ARCS` array referencing the new episode IDs
3. Add a season entry: `{ id: 2, name: 'Two Blue Vortex', subtitle: 'Серии 1–...', image: '/images/boruto-season2.jpg' }`
4. Update `maxEpisodeId` to the new highest episode ID
5. Update episode counts in `WATCH_MODES` — these must be exact, not approximate
6. Add images to `client/public/images/` (optimize to ≤300KB for heroes, ≤100KB for arcs)

### Adding a new series

1. Create `client/src/lib/series/newseries.ts` following the pattern of `naruto.ts` or `boruto.ts`
2. Add the series ID to the `SeriesId` type in `series-config.ts`
3. Register it in `series-registry.ts`
4. Add it to `SERIES_LIST` in `series-config.ts`
5. Add hero/arc images to `client/public/images/`

### Watch modes

Each mode defines which marker types are included. The `episodes` field must show the exact count — compute it by summing the actual episode ranges for all entries whose marker is in the mode's `markers` array.

### Images

Place images in `client/public/images/`. Target sizes:
- Hero backgrounds: 1920px wide, quality 80 (~250KB)
- Season headers: 1280px wide, quality 75 (~150KB)
- Arc backgrounds: 800px wide, quality 75 (~50-100KB)
