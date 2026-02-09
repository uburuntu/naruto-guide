# Naruto Guide

Interactive viewing guide for the Naruto anime series (720 episodes, 11 films, 13 OVAs). Based on the [guide by Даинг Окаянный](https://shikimori.one/articles/365-naruto-ultimativnyy-gayd-po-prosmotru) on Shikimori.

## Features

- 6 viewing modes (Speedrun → Full Immersion)
- Color-coded episode markers by type (story, filler tiers, recaps, novels)
- Progress tracker with localStorage persistence
- Spoiler blur toggle
- Season filtering and navigation

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
