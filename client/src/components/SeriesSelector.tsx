import { SERIES_LIST, type SeriesId } from '@/lib/series-config';
import { motion } from 'framer-motion';

interface SeriesSelectorProps {
  activeSeries: SeriesId;
  onSeriesChange: (series: SeriesId) => void;
}

export function SeriesSelector({ activeSeries, onSeriesChange }: SeriesSelectorProps) {
  return (
    <div className="sticky top-0 z-[60] bg-background/90 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto py-2 flex items-center justify-center">
        <div className="relative flex bg-muted/30 rounded-lg p-0.5 border border-border/50">
          {SERIES_LIST.map(option => (
            <button
              key={option.id}
              onClick={() => onSeriesChange(option.id)}
              className={`
                relative px-5 py-1.5 rounded-md text-sm font-display font-semibold transition-colors z-10
                ${activeSeries === option.id
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {activeSeries === option.id && (
                <motion.div
                  layoutId="series-tab-indicator"
                  className="absolute inset-0 bg-primary rounded-md"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
