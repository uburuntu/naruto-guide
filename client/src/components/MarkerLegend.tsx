/**
 * MarkerLegend — легенда маркировки серий
 * Показывает все маркеры с описаниями, сгруппированные по типу
 */
import { MARKERS, type MarkerType } from '@/lib/data';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

const BASIC_MARKERS: MarkerType[] = ['С', 'Ф1', 'Ф2', 'Ф3', 'Ф4', 'ФН', 'П'];
const MIXED_MARKERS: MarkerType[] = ['С+Ф1', 'С+Ф2', 'С+Ф3', 'С+Ф4', 'С+ФН'];

function MarkerItem({ marker }: { marker: MarkerType }) {
  const info = MARKERS[marker];
  if (!info) return null;
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-card/40 border border-border/50">
      <span
        className="inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold font-display shrink-0 border"
        style={{
          color: info.color,
          backgroundColor: info.bgColor,
          borderColor: info.color + '33',
        }}
      >
        {info.label}
      </span>
      <span className="text-xs text-muted-foreground leading-snug">
        {info.description}
      </span>
    </div>
  );
}

export function MarkerLegend() {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-display font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors w-full">
        <span>Маркировка серий</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-4 space-y-4">
          {/* Основные маркеры */}
          <div>
            <p className="text-[11px] font-display text-muted-foreground/60 uppercase tracking-wider mb-2">Основные</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {BASIC_MARKERS.map(marker => (
                <MarkerItem key={marker} marker={marker} />
              ))}
            </div>
          </div>
          {/* Смешанные маркеры */}
          <div>
            <p className="text-[11px] font-display text-muted-foreground/60 uppercase tracking-wider mb-2">Смешанные (сюжет + филлер)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {MIXED_MARKERS.map(marker => (
                <MarkerItem key={marker} marker={marker} />
              ))}
            </div>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
