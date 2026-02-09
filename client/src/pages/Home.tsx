import { useState, useCallback, useMemo, useRef } from 'react';
import { EPISODES, WATCH_MODES, SOURCE_URL, SOURCE_AUTHOR, type MarkerType } from '@/lib/data';
import { FilterPanel } from '@/components/FilterPanel';
import { StatsPanel } from '@/components/StatsPanel';
import { ProgressBar } from '@/components/ProgressBar';
import { MarkerLegend } from '@/components/MarkerLegend';
import { EpisodeRow } from '@/components/EpisodeRow';
import { useSpoilerMode } from '@/hooks/useSpoilerMode';
import { EyeOff, Eye, BookOpen, ExternalLink, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

const WATCHED_STORAGE_KEY = 'naruto-watched';

function loadWatched(): Set<number> {
  try {
    const saved = localStorage.getItem(WATCHED_STORAGE_KEY);
    if (saved) return new Set(JSON.parse(saved) as number[]);
  } catch {}
  return new Set();
}

function saveWatched(watched: Set<number>) {
  try {
    localStorage.setItem(WATCHED_STORAGE_KEY, JSON.stringify([...watched]));
  } catch {}
}

export default function Home() {
  const [activeMode, setActiveMode] = useState('all');
  const [activeSeason, setActiveSeason] = useState<'all' | 1 | 2>('all');
  const [watched, setWatched] = useState<Set<number>>(loadWatched);
  const { spoilersHidden, toggleSpoilers } = useSpoilerMode();
  const contentRef = useRef<HTMLDivElement>(null);

  const currentMode = WATCH_MODES.find(m => m.id === activeMode) || WATCH_MODES[0];

  const filteredEpisodes = useMemo(() => {
    return EPISODES.filter(ep => {
      if (!currentMode.markers.includes(ep.marker as MarkerType)) return false;
      if (activeSeason !== 'all' && ep.season !== activeSeason) return false;
      return true;
    });
  }, [activeMode, activeSeason, currentMode.markers]);

  const season1Episodes = useMemo(() => filteredEpisodes.filter(ep => ep.season === 1), [filteredEpisodes]);
  const season2Episodes = useMemo(() => filteredEpisodes.filter(ep => ep.season === 2), [filteredEpisodes]);

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
      saveWatched(next);
      return next;
    });
  }, []);

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const showSeasonHeaders = activeSeason === 'all' && season1Episodes.length > 0 && season2Episodes.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ===== HERO SECTION ===== */}
      <section className="relative h-[85vh] min-h-[500px] max-h-[900px] flex items-end overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/images/naruto-hero.jpg"
            alt=""
            className="w-full h-full object-cover object-top"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent" />
        </div>

        {/* Hero Content */}
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
                Ультимативный гайд
              </span>
            </div>

            <h1 className="font-display font-bold text-foreground leading-none mb-2">
              <span className="text-5xl sm:text-7xl block">Наруто</span>
              <span className="text-4xl sm:text-6xl block text-primary mt-1">Гайд по просмотру</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground mt-6 max-w-lg leading-relaxed">
              Все 720 серий, 11 фильмов и 13 ОВА — с маркировкой по важности,
              хронологическим порядком и интерактивным трекером прогресса.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-8">
              <button
                onClick={scrollToContent}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-display font-semibold text-sm hover:brightness-110 transition-all glow-orange"
              >
                <BookOpen className="w-4 h-4" />
                Начать просмотр
              </button>
              <a
                href={SOURCE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-border bg-card/30 backdrop-blur-sm text-foreground font-display font-semibold text-sm hover:bg-card/50 transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                Оригинал гайда
              </a>
            </div>
          </motion.div>

          {/* Scroll indicator */}
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

      {/* ===== STICKY HEADER (appears on scroll) ===== */}
      <header ref={contentRef} className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-display font-bold text-foreground">
                Наруто: Гайд
              </h2>
              <span className="hidden sm:inline text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                {currentMode.name}
              </span>
            </div>
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
      </header>

      {/* ===== MAIN CONTENT (with pattern background) ===== */}
      <main className="relative">
        {/* Subtle pattern background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'url(/images/naruto-pattern.jpg)', backgroundSize: '600px', backgroundRepeat: 'repeat' }}
        />

        <div className="relative container mx-auto py-8 space-y-8">
          {/* Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <ProgressBar watched={watchedInFiltered} total={filteredEpisodes.length} />
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

          {/* ===== EPISODE LIST ===== */}
          <div className="space-y-2">
            {showSeasonHeaders ? (
              <>
                {/* Season 1 Header */}
                <SeasonHeader
                  title="Сезон 1: Наруто"
                  subtitle="Серии 1–220"
                  image="/images/naruto-season1.jpg"
                />
                {season1Episodes.map(episode => (
                  <EpisodeRow
                    key={episode.id}
                    episode={episode}
                    isWatched={watched.has(episode.id)}
                    onToggle={toggleWatched}
                    isVisible={true}
                    spoilersHidden={spoilersHidden}
                  />
                ))}

                {/* Season 2 Header */}
                <div className="pt-6">
                  <SeasonHeader
                    title="Сезон 2: Ураганные Хроники"
                    subtitle="Серии 1–500"
                    image="/images/naruto-season2.jpg"
                  />
                </div>
                {season2Episodes.map(episode => (
                  <EpisodeRow
                    key={episode.id}
                    episode={episode}
                    isWatched={watched.has(episode.id)}
                    onToggle={toggleWatched}
                    isVisible={true}
                    spoilersHidden={spoilersHidden}
                  />
                ))}
              </>
            ) : (
              <>
                {/* Single season header when filtered */}
                {activeSeason === 1 && (
                  <SeasonHeader
                    title="Сезон 1: Наруто"
                    subtitle="Серии 1–220"
                    image="/images/naruto-season1.jpg"
                  />
                )}
                {activeSeason === 2 && (
                  <SeasonHeader
                    title="Сезон 2: Ураганные Хроники"
                    subtitle="Серии 1–500"
                    image="/images/naruto-season2.jpg"
                  />
                )}
                {filteredEpisodes.map(episode => (
                  <EpisodeRow
                    key={episode.id}
                    episode={episode}
                    isWatched={watched.has(episode.id)}
                    onToggle={toggleWatched}
                    isVisible={true}
                    spoilersHidden={spoilersHidden}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="relative border-t border-border mt-12">
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{ backgroundImage: 'url(/images/naruto-pattern.jpg)', backgroundSize: '600px', backgroundRepeat: 'repeat' }}
        />
        <div className="relative container mx-auto py-8 text-center text-sm text-muted-foreground space-y-2">
          <p>
            Данные взяты из{' '}
            <a href={SOURCE_URL} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 underline underline-offset-2 transition-colors">
              гайда на Shikimori
            </a>
            {' '}от {SOURCE_AUTHOR}
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
