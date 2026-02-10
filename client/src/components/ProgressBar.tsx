/**
 * ProgressBar — прогресс просмотра
 * Дизайн: оранжевый градиент с glow-эффектом
 */
import { motion } from 'framer-motion';

interface ProgressBarProps {
  watched: number;
  total: number;
  label: string;
}

export function ProgressBar({ watched, total, label }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((watched / total) * 100) : 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-display font-medium text-foreground">
          {label}
        </span>
        <span className="text-sm font-display text-muted-foreground">
          <span className="text-primary font-bold">{watched}</span>
          <span className="mx-1">/</span>
          <span>{total}</span>
          <span className="ml-2 text-xs text-muted-foreground/70">({percentage}%)</span>
        </span>
      </div>
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: 'linear-gradient(90deg, oklch(0.72 0.19 55), oklch(0.65 0.20 40))',
            boxShadow: '0 0 12px oklch(0.72 0.19 55 / 0.5)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
