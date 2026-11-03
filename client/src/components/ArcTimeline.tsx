import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { MARKERS } from '@/lib/data';
import { groupRoute, isWatched } from '@/lib/watch-route';

interface Props {
  groups: ReturnType<typeof groupRoute>;
  watched: Set<string>;
  onArcClick: (sectionId: string) => void;
}

export function ArcTimeline({ groups, watched, onArcClick }: Props) {
  if (!groups.length) return null;
  return (
    <div>
      <h3 className="mb-2 text-sm font-display font-semibold text-muted-foreground uppercase">Таймлайн</h3>
      <div className="flex gap-0.5 h-8 rounded-lg overflow-hidden bg-muted/30">
        {groups.map(({ id, arc, episodes }) => {
          const items = episodes.flatMap(row => row.items);
          const seen = items.filter(item => isWatched(watched, item)).length;
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button aria-label={arc.name} onClick={() => onArcClick(id)} className="relative min-w-1"
                  style={{ flex: items.length, color: MARKERS[episodes[0].marker].color }}>
                  <span className="absolute inset-0 bg-current opacity-30" />
                  <span className="absolute inset-y-0 left-0 bg-current" style={{ width: `${100 * seen / items.length}%` }} />
                </button>
              </TooltipTrigger>
              <TooltipContent><p>{arc.name}</p><p>{seen}/{items.length}</p></TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
