/**
 * FilterPanel — панель фильтров по вариантам просмотра
 * Дизайн: карточки с glow-эффектами при выборе
 */
import type { WatchMode } from '@/lib/data';
import type { SeasonDefinition } from '@/lib/series-config';
import { motion } from 'framer-motion';

interface FilterPanelProps {
  activeMode: string;
  onModeChange: (modeId: string) => void;
  activeSeason: 'all' | number;
  onSeasonChange: (season: 'all' | number) => void;
  watchModes: WatchMode[];
  seasons: SeasonDefinition[];
}

function ModeCard({ mode, isActive, onClick }: { mode: WatchMode; isActive: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`
        relative flex flex-col items-start p-3 sm:p-4 rounded-lg border text-left transition-all duration-200 w-full
        ${isActive
          ? 'border-primary/60 bg-primary/10'
          : 'border-border bg-card/40 hover:bg-card/60 hover:border-border/80'
        }
      `}
      style={isActive ? { boxShadow: '0 0 20px oklch(0.72 0.19 55 / 0.2)' } : {}}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{mode.icon}</span>
        <span className={`font-display font-semibold text-sm ${isActive ? 'text-primary' : 'text-foreground'}`}>
          {mode.shortName}
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{mode.episodes}</p>
    </motion.button>
  );
}

export function FilterPanel({ activeMode, onModeChange, activeSeason, onSeasonChange, watchModes, seasons }: FilterPanelProps) {
  return (
    <div className="space-y-4">
      {/* Варианты просмотра */}
      <div>
        <h3 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Вариант просмотра
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {watchModes.map(mode => (
            <ModeCard
              key={mode.id}
              mode={mode}
              isActive={activeMode === mode.id}
              onClick={() => onModeChange(mode.id)}
            />
          ))}
        </div>
        {/* Описание выбранного режима */}
        {watchModes.find(m => m.id === activeMode) && (
          <motion.p
            key={activeMode}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-sm text-muted-foreground bg-muted/30 rounded-lg px-4 py-2.5 border border-border/50"
          >
            {watchModes.find(m => m.id === activeMode)!.description}
          </motion.p>
        )}
      </div>

      {/* Фильтр по сезонам */}
      {seasons.length > 1 && (
        <div>
          <h3 className="text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Сезон
          </h3>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => onSeasonChange('all')}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
                ${activeSeason === 'all'
                  ? 'bg-accent/20 border-accent/40 text-accent-foreground'
                  : 'bg-card/40 border-border text-muted-foreground hover:bg-card/60'
                }
              `}
            >
              Все
            </button>
            {seasons.map(s => (
              <button
                key={s.id}
                onClick={() => onSeasonChange(s.id)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
                  ${activeSeason === s.id
                    ? 'bg-accent/20 border-accent/40 text-accent-foreground'
                    : 'bg-card/40 border-border text-muted-foreground hover:bg-card/60'
                  }
                `}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
