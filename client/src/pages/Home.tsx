import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { RouteCheckpoint } from '@/components/RouteCheckpoint';
import { buildRoute, extraChoices, groupRoute, isWatched, itemLabel, markItems, routeSummary, type Item } from '@/lib/watch-route';
import { loadWatchProgress, decodeWatchProgress, encodeWatchProgress } from '@/lib/watch-progress';
import { readSettings, setRouteParams, type RouteSettings } from '@/lib/route-settings';
import type { SeriesConfig } from '@/lib/series-config';
import { buildEpisodeToArcMap, searchEpisodes } from '@/lib/arc-utils';
import { getProgressFromURL, clearProgressFromURL } from '@/lib/progress-sharing';
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

export default function Home({ config }: HomeProps) {
  const [settings, setSettings] = useState(() => readSettings(config));
  const activeMode = settings.mode;
  function changeSettings(next: RouteSettings) {
    setSettings(next);
    const url = new URL(window.location.href);
    setRouteParams(url, next);
    window.history.replaceState(window.history.state, '', url);
    try { localStorage.setItem(config.id + '-route', JSON.stringify(next)); } catch {}
  }
  const [activeSeason, setActiveSeason] = useState<'all' | number>('all');
  const [watched, setWatched] = useState(() => loadWatchProgress(config));
  const [searchInput, setSearchInput] = useState('');
  const [importDialog, setImportDialog] = useState<{ watched: Set<string> } | null>(null);
  const searchQuery = useDebounce(searchInput, 300);
  const { spoilersHidden, toggleSpoilers } = useSpoilerMode(config.storageKeys.spoilerMode);
  const { isCollapsed, toggleArc } = useCollapsedArcs(config.storageKeys.collapsedArcs);
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
      const imported = decodeWatchProgress(encoded, config);
      if (imported.size > 0) {
        setImportDialog({ watched: imported });
      }
    }
  }, [config]);

  const handleDismissImport = useCallback(() => {
    setImportDialog(null);
    clearProgressFromURL(config.progressUrlParam, config.seriesUrlParam);
  }, [config.progressUrlParam, config.seriesUrlParam]);

  function writeWatched(next: Set<string>) {
    setWatched(next);
    try { localStorage.setItem(config.storageKeys.watched + '-v2', encodeWatchProgress(next)); } catch {}
  }

  useEffect(() => {
    const key = config.storageKeys.watched;
    function sync(event: StorageEvent) {
      if (event.key === null || event.key === key || event.key === key + '-v2') setWatched(loadWatchProgress(config));
    }
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [config]);

  function handleImport(action: 'replace' | 'merge') {
    if (!importDialog) return;
    writeWatched(action === 'replace' ? importDialog.watched : new Set([...watched, ...importDialog.watched]));
    handleDismissImport();
  }

  const routes = useMemo(() => Object.fromEntries(config.watchModes.map(mode => {
    const rows = buildRoute(config, mode, settings);
    return [mode.id, activeSeason === 'all' ? rows : rows.filter(row => row.season === activeSeason)];
  })), [config, settings, activeSeason]);
  const filteredEpisodes = routes[activeMode];
  const summaries = useMemo(() => Object.fromEntries(Object.entries(routes).map(([mode, rows]) =>
    [mode, routeSummary(rows)])), [routes]);
  const episodeToArc = useMemo(() => buildEpisodeToArcMap(config.arcs), [config]);
  const searchedEpisodes = useMemo(() => searchEpisodes(filteredEpisodes, searchQuery, episodeToArc),
    [filteredEpisodes, searchQuery, episodeToArc]);
  const arcGroups = useMemo(() => groupRoute(searchedEpisodes, episodeToArc), [searchedEpisodes, episodeToArc]);
  const items = useMemo(() => filteredEpisodes.flatMap(row => row.items), [filteredEpisodes]);
  const watchedInFiltered = items.filter(item => isWatched(watched, item)).length;
  const nextRow = filteredEpisodes.find(row => row.items.some(item => !isWatched(watched, item)));
  const nextItem = nextRow?.items.find(item => !isWatched(watched, item));
  const [jump, setJump] = useState('');
  function continueRoute() {
    if (!nextRow || !nextItem) return;
    setSearchInput('');
    const arc = episodeToArc.get(nextRow.id)!;
    if (isCollapsed(arc.id)) toggleArc(arc.id);
    setJump(nextItem.key);
  }
  useEffect(() => {
    if (!jump || searchQuery) return;
    const row = document.getElementById('episode-' + jump) ?? document.getElementById('row-' + jump);
    if (!row) return;
    const details = row.closest('details');
    if (details) details.open = true;
    row.focus({ preventScroll: true });
    row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    setJump('');
  }, [jump, searchQuery, arcGroups]);

  function batchToggle(items: Item[], checked: boolean) {
    writeWatched(markItems(watched, items, checked));
  }

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
                Обнаружен прогресс из ссылки ({importDialog.watched.size} отметок). Что сделать?
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
                onClick={nextItem ? continueRoute : scrollToContent}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm hover:brightness-110 transition-all glow-orange"
              >
                <BookOpen className="w-4 h-4" />
                {nextRow && nextItem ? `${watchedInFiltered ? 'Продолжить' : 'Начать'} · ${itemLabel(nextRow, nextItem.number)}` : 'Маршрут пройден'}
              </button>
              {config.sourceUrl && (
                <a
                  href={config.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card/30 backdrop-blur-sm text-foreground font-display font-semibold text-sm hover:bg-card/50 transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  {config.id === 'boruto' ? 'Официальный каталог' : 'Оригинал гайда'}
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
      <header ref={contentRef} className="sticky top-12 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
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
                settings={settings}
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
            <ProgressBar watched={watchedInFiltered} total={items.length} label={config.progressBarLabel} />
            <RouteCheckpoint key={activeMode + activeSeason + settings.extras.join() + settings.recaps} rows={filteredEpisodes} seasons={config.seasons.filter(s => activeSeason === 'all' || s.id === activeSeason)} onMark={batchToggle} />
          </motion.div>

          {/* Arc Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <ArcTimeline
              groups={arcGroups}
              watched={watched}
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
              onModeChange={mode => changeSettings({ ...settings, mode })}
              summaries={summaries}
              activeSeason={activeSeason}
              onSeasonChange={setActiveSeason}
              watchModes={config.watchModes}
              seasons={config.seasons}
            />
            {config.id === 'naruto' && activeMode === 'speedrun' && (
              <fieldset className="mt-4 flex flex-wrap gap-3 text-sm">
                <legend className="mb-2 text-muted-foreground">Дополнения к спидрану · посмотреть целиком</legend>
                {extraChoices.map(choice => (
                  <label key={choice.id} className="flex gap-2 items-center">
                    <input type="checkbox" checked={settings.extras.includes(choice.id)} onChange={event =>
                      changeSettings({ ...settings, extras: event.target.checked
                        ? [...settings.extras, choice.id] : settings.extras.filter(id => id !== choice.id) })} />
                    {choice.label}
                  </label>
                ))}
              </fieldset>
            )}
            {config.id === 'naruto' && activeMode === 'survival' && (
              <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.recaps}
                onChange={event => changeSettings({ ...settings, recaps: event.target.checked })} />Включить шесть серий-повторок</label>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <StatsPanel filteredEpisodes={filteredEpisodes} />
          </motion.div>

          {/* Legend */}
          <MarkerLegend />
          {config.id === 'naruto' && (
            <details className="text-sm text-muted-foreground">
              <summary className="cursor-pointer">О рекомендациях и озвучке</summary>
              <p className="mt-2">Даинг Окаянный оценивает филлеры по личным впечатлениям. Новичкам он рекомендует «Стандарт» или «Золотой стандарт».</p>
              <p className="mt-2">Автор предпочитает 2×2 для первого сезона и старую озвучку 2×2 для серий 1–318 второго. С 319-й серии — 2×2 New. Для фильмов 7–10 он отмечает Reanimedia, для 1, 2, 9 и 11 — Flarrow Films. Для ОВА в сети обычно доступны любительские версии.</p>
            </details>
          )}

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
                {group.arcs.map(({ id, arc, episodes }) => (
                  <ArcSection
                    key={id}
                    sectionId={id}
                    arc={arc}
                    episodes={episodes}
                    watched={watched}
                    onBatchToggle={batchToggle}
                    spoilersHidden={spoilersHidden}
                    isCollapsed={searchQuery ? false : isCollapsed(arc.id)}
                    onToggleCollapse={() => toggleArc(arc.id)}
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
              {config.id === 'boruto' ? 'Границы арок — ' : 'Данные взяты из '}
              <a href={config.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 underline underline-offset-2 transition-colors">
                {config.id === 'boruto' ? 'NARUTO OFFICIAL SITE' : 'гайда на Shikimori'}
              </a>
              {config.id === 'boruto' ? '. Маркеры — рекомендации гайда.' : ` от ${config.sourceAuthor}`}
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
