import { Star } from 'lucide-react';

interface RatingBadgeProps {
  rating: number;
}

function getRatingColor(rating: number): string {
  if (rating >= 9.0) return '#eab308';
  if (rating >= 8.0) return '#22c55e';
  if (rating >= 7.0) return '#3b82f6';
  return '#6b7280';
}

export function RatingBadge({ rating }: RatingBadgeProps) {
  const color = getRatingColor(rating);
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-bold font-display"
      style={{ color, backgroundColor: color + '1a' }}
    >
      <Star className="w-3 h-3 fill-current" />
      {rating.toFixed(1)}
    </span>
  );
}
