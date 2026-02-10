import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import type { MarkerType } from '@/lib/data';
import type { SeriesConfig } from '@/lib/series-config';
import { groupEpisodesByArcs } from '@/lib/arc-utils';
import { getProgressFromURL, decodeProgress, clearProgressFromURL } from '@/lib/progress-sharing';
import { FilterPanel } from '@/components/FilterPanel';
import { StatsPanel } from '@/components/StatsPanel';
import { ProgressBar } from '@/components/ProgressBar';
import { MarkerLegend } from '@/components/MarkerLegend';
import { ArcSection } from '@/components/ArcSection';
import { ArcTimeline } from '@/components/ArcTimeline';
import { SearchBar } from '@/components/SearchBar';
import { ShareButton } from '@/components/ShareButton';
import { useSpoilerMode } from '@/hooks/useSpoilerMode';
import { useCollapsedArcs } from '@/hooks/useCollapsedArcs';
import { useDebounce } from '@/hooks/useDebounce';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { EyeOff, Eye, BookOpen, ExternalLink, ChevronDown, Download, Combine, X, Smartphone, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HomeProps {
  config: SeriesConfig;
}

function getModeFromURL(defaultModeId: string): string {
  const params = new URLSearchParams(window.location.search);
  return params.get('mode') || defaultModeId;
}

function setModeInURL(mode: string, defaultModeId: string) {
  const url = new URL(window.location.href);
  if (mode === defaultModeId) {
    url.searchParams.delete('mode');
  } else {
    url.searchParams.set('mode', mode);
  }
  window.history.replaceState({}, '', url.pathname + url.search);
}

function loadWatched(storageKey: string): Set<number> {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) return new Set(JSON.parse(saved) as number[]);
  } catch {}
  return new Set();
}

function saveWatched(storageKey: string, watched: Set<number>) {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...watched]));
  } catch {}
}

export default function Home({ config }: HomeProps) {
  const [activeMode, setActiveModeState] = useState(() => getModeFromURL(config.defaultModeId));

  const setActiveMode = useCallback((mode: string) => {
    setActiveModeState(mode);
    setModeInURL(mode, config.defaultModeId);
  }, [config.defaultModeId]);
  const [activeSeason, setActiveSeason] = useState<'all' | number>('all');
  const [watched, setWatched] = useState<Set<number>>(() => loadWatched(config.storageKeys.watched));
  const [searchInput, setSearchInput] = useState('');
  const [importDialog, setImportDialog] = useState<{ watched: Set<number> } | null>(null);
  const searchQuery = useDebounce(searchInput, 300);
  const { spoilersHidden, toggleSpoilers } = useSpoilerMode(config.storageKeys.spoilerMode);
  const { isCollapsed, toggleArc, expandAll } = useCollapsedArcs(config.storageKeys.collapsedArcs);
  const contentRef = useRef<HTMLDivElement>(null);
  const { canInstall, promptInstall } = usePWAInstall();

  const currentMode = config.watchModes.find(m => m.id === activeMode) || config.watchModes[0];

  // Update document title
  useEffect(() => {
    document.title = config.fullTitle;
  }, [config.fullTitle]);

  // Check URL for shared progress on mount
  useEffect(() => {
    const encoded = getProgressFromURL(config.progressUrlParam);
    if (encoded) {
      const imported = decodeProgress(encoded, config.maxEpisodeId);
      if (imported.size > 0) {
        setImportDialog({ watched: imported });
      }
    }
  }, [config.progressUrlParam, config.maxEpisodeId]);

  const handleImport = useCallback((mode: 'replace' | 'merge') => {
    if (!importDialog) return;
    setWatched(prev => {
      let next: Set<number>;
      if (mode === 'replace') {
        next = new Set(importDialog.watched);
      } else {
        next = new Set([...prev, ...importDialog.watched]);
      }
      saveWatched(config.storageKeys.watched, next);
      return next;
    });
    setImportDialog(null);
    clearProgressFromURL(config.progressUrlParam);
  }, [importDialog, config.storageKeys.watched, config.progressUrlParam]);

  const handleDismissImport = useCallback(() => {
    setImportDialog(null);
    clearProgressFromURL(config.progressUrlParam);
  }, [config.progressUrlParam]);

  // Filter episodes by mode and season
  const filteredEpisodes = useMemo(() => {
    return config.episodes.filter(ep => {
      if (!currentMode.markers.includes(ep.marker as MarkerType)) return false;
      if (activeSeason !== 'all' && ep.season !== activeSeason) return false;
      return true;
    });
  }, [config.episodes, activeMode, activeSeason, currentMode.markers]);

  // Build episode-to-arc map for search
  const episodeToArc = useMemo(() => {
    const map = new Map<number, string>();
    for (const arc of config.arcs) {
      for (const id of arc.episodeIds) {
        map.set(id, arc.name);
      }
    }
    return map;
  }, [config.arcs]);

  // Apply search filter
  const searchedEpisodes = useMemo(() => {
    if (!searchQuery.trim()) return filteredEpisodes;
    const q = searchQuery.toLowerCase().trim();
    return filteredEpisodes.filter(ep => {
      if (ep.title.toLowerCase().includes(q)) return true;
      if (ep.episodes.toLowerCase().includes(q)) return true;
      if (ep.note?.toLowerCase().includes(q)) return true;
      const arcName = episodeToArc.get(ep.id);
      if (arcName?.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [filteredEpisodes, searchQuery, episodeToArc]);

  // Group by arcs
  const arcGroups = useMemo(() => {
    return groupEpisodesByArcs(config.arcs, searchedEpisodes, activeSeason === 'all' ? undefined : activeSeason);
  }, [config.arcs, searchedEpisodes, activeSeason]);

  const visibleEpisodeIds = useMemo(() => {
    return new Set(searchedEpisodes.map(e => e.id));
  }, [searchedEpisodes]);

  const watchedInFiltered = useMemo(() => {
    return filteredEpisodes.filter(ep => watched.has(ep.id)).length;
  }, [filteredEpisodes, watched]);

  const toggleWatched = useCallback((id: number) => {
    setWatched(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveWatched(config.storageKeys.watched, next);
      return next;
    });
  }, [config.storageKeys.watched]);

  const batchToggle = useCallback((ids: number[], state: boolean) => {
    setWatched(prev => {
      const next = new Set(prev);
      for (const id of ids) {
        if (state) next.add(id);
        else next.delete(id);
      }
      saveWatched(config.storageKeys.watched, next);
      return next;
    });
  }, [config.storageKeys.watched]);

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleArcClick = useCallback((arcId: string) => {
    const el = document.getElementById(`arc-${arcId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  // Dynamic season grouping
  const seasonGroups = useMemo(() => {
    if (activeSeason !== 'all') {
      const season = config.seasons.find(s => s.id === activeSeason);
      if (season) return [{ season, arcs: arcGroups }];
      return [{ season: config.seasons[0], arcs: arcGroups }];
    }
    return config.seasons
      .map(season => ({
        season,
        arcs: arcGroups.filter(g => g.arc.season === season.id),
      }))
      .filter(g => g.arcs.length > 0);
  }, [arcGroups, activeSeason, config.seasons]);

  const showSeasonHeaders = seasonGroups.length > 1 ||
    (seasonGroups.length === 1 && activeSeason !== 'all');

  return (
    <div className="min-h-screen bg-background">
      {/* ===== IMPORT DIALOG ===== */}
      <AnimatePresence>
        {importDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-display font-bold text-foreground">Импорт прогресса</h3>
                <button onClick={handleDismissImport} className="p-1 rounded hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Обнаружен прогресс из ссылки ({importDialog.watched.size} записей). Что сделать?
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleImport('replace')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-sm hover:brightness-110 transition-all"
                >
                  <Download className="w-4 h-4" />
                  Заменить текущий
                </button>
                <button
                  onClick={() => handleImport('merge')}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card/60 text-foreground font-display font-semibold text-sm hover:bg-card/80 transition-all"
                >
                  <Combine className="w-4 h-4" />
                  Объединить
                </button>
                <button
                  onClick={handleDismissImport}
                  className="px-4 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== HERO SECTION ===== */}
      <section className="relative h-[85vh] min-h-[500px] max-h-[900px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={config.hero.image}
            alt=""
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />
        </div>

        <div className="relative container mx-auto pb-12 sm:pb-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="text-sm font-display font-semibold text-primary uppercase tracking-wider">
                {config.hero.badgeText}
              </span>
            </div>

            <h1 className="font-display font-bold text-foreground leading-none mb-2">
              <span className="text-5xl sm:text-7xl block">{config.hero.title}</span>
              <span className="text-4xl sm:text-6xl block text-primary mt-1">{config.hero.subtitle}</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground mt-6 max-w-lg leading-relaxed">
              {config.hero.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <button
                onClick={scrollToContent}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm hover:brightness-110 transition-all glow-orange"
              >
                <BookOpen className="w-4 h-4" />
                {config.hero.ctaText}
              </button>
              {config.sourceUrl && (
                <a
                  href={config.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card/30 backdrop-blur-sm text-foreground font-display font-semibold text-sm hover:bg-card/50 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Оригинал гайда
                </a>
              )}
              {canInstall && (
                <button
                  onClick={promptInstall}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card/30 backdrop-blur-sm text-foreground font-display font-semibold text-sm hover:bg-card/50 transition-all"
                >
                  <Smartphone className="w-4 h-4" />
                  Установить приложение
                </button>
              )}
            </div>
          </motion.div>

          <motion.button
            onClick={scrollToContent}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-muted-foreground/40 hover:text-muted-foreground transition-colors hidden sm:block"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-6 h-6" />
          </motion.button>
        </div>
      </section>

      {/* ===== STICKY HEADER ===== */}
      <header ref={contentRef} className="sticky top-10 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto py-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-display font-bold text-foreground shrink-0">
              {config.stickyHeaderTitle}
            </h2>
            <span className="hidden sm:inline text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md shrink-0">
              {currentMode.name}
            </span>
            <div className="flex-1 max-w-xs hidden sm:block">
              <SearchBar value={searchInput} onChange={setSearchInput} />
            </div>
            <div className="flex items-center gap-2 ml-auto shrink-0">
              {canInstall && (
                <button
                  onClick={promptInstall}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border bg-card/40 hover:bg-card/60 transition-colors text-muted-foreground"
                  title="Установить приложение"
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="hidden sm:inline">Установить</span>
                </button>
              )}
              <ShareButton
                watched={watched}
                maxEpisodeId={config.maxEpisodeId}
                progressParam={config.progressUrlParam}
                seriesParam={config.seriesUrlParam}
              />
              <button
                onClick={toggleSpoilers}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-border bg-card/40 hover:bg-card/60 transition-colors text-muted-foreground"
                title={spoilersHidden ? 'Показать спойлеры' : 'Скрыть спойлеры'}
              >
                {spoilersHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="hidden sm:inline">{spoilersHidden ? 'Спойлеры скрыты' : 'Спойлеры видны'}</span>
              </button>
            </div>
          </div>
          {/* Mobile search */}
          <div className="sm:hidden mt-2">
            <SearchBar value={searchInput} onChange={setSearchInput} />
          </div>
        </div>
      </header>

      {/* ===== MAIN CONTENT ===== */}
      <main className="relative">
        {config.hero.patternImage && (
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{ backgroundImage: `url(${config.hero.patternImage})`, backgroundSize: '600px', backgroundRepeat: 'repeat' }}
          />
        )}

        <div className="relative container mx-auto py-8 space-y-8">
          {/* Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <ProgressBar watched={watchedInFiltered} total={filteredEpisodes.length} label={config.progressBarLabel} />
          </motion.div>

          {/* Arc Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <ArcTimeline
              arcs={config.arcs}
              episodes={config.episodes}
              watched={watched}
              visibleEpisodeIds={visibleEpisodeIds}
              onArcClick={handleArcClick}
            />
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <FilterPanel
              activeMode={activeMode}
              onModeChange={setActiveMode}
              activeSeason={activeSeason}
              onSeasonChange={setActiveSeason}
              watchModes={config.watchModes}
              seasons={config.seasons}
            />
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <StatsPanel filteredEpisodes={filteredEpisodes} watchedCount={watchedInFiltered} />
          </motion.div>

          {/* Legend */}
          <MarkerLegend />

          {/* ===== ARC-GROUPED EPISODE LIST ===== */}
          <div className="space-y-2">
            {seasonGroups.map((group, index) => (
              <div key={group.season.id}>
                {index > 0 && <div className="pt-6" />}
                {showSeasonHeaders && group.season.image && (
                  <SeasonHeader
                    title={group.season.name}
                    subtitle={group.season.subtitle}
                    image={group.season.image}
                  />
                )}
                {group.arcs.map(({ arc, episodes }) => (
                  <ArcSection
                    key={arc.id}
                    arc={arc}
                    episodes={episodes}
                    watched={watched}
                    onToggle={toggleWatched}
                    onBatchToggle={batchToggle}
                    spoilersHidden={spoilersHidden}
                    isCollapsed={searchQuery ? false : isCollapsed(arc.id)}
                    onToggleCollapse={() => toggleArc(arc.id)}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
            ))}

            {searchQuery && arcGroups.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg font-display">Ничего не найдено</p>
                <p className="text-sm mt-1">Попробуйте изменить поисковый запрос</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="relative border-t border-border mt-12">
        {config.hero.patternImage && (
          <div
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{ backgroundImage: `url(${config.hero.patternImage})`, backgroundSize: '600px', backgroundRepeat: 'repeat' }}
          />
        )}
        <div className="relative container mx-auto py-8 text-center text-sm text-muted-foreground space-y-2">
          {config.sourceUrl && config.sourceAuthor && (
            <p>
              Данные взяты из{' '}
              <a href={config.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 underline underline-offset-2 transition-colors">
                гайда на Shikimori
              </a>
              {' '}от {config.sourceAuthor}
            </p>
          )}
          <p>
            <a
              href="https://github.com/uburuntu/naruto-guide?tab=readme-ov-file#contributing-data-edits-and-new-seasons"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              Код проекта
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function SeasonHeader({ title, subtitle, image }: { title: string; subtitle: string; image: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="relative h-40 sm:h-48 rounded-xl overflow-hidden mb-4"
    >
      <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
      <div className="relative h-full flex flex-col justify-end p-6">
        <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>
    </motion.div>
  );
}
