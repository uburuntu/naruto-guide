import { useState } from 'react';
import type { Item, RouteRow } from '@/lib/watch-route';
import type { SeasonDefinition } from '@/lib/series-config';

interface Props {
  rows: RouteRow[];
  seasons: SeasonDefinition[];
  onMark: (items: Item[], checked: boolean) => void;
}

export function RouteCheckpoint({ rows, seasons, onMark }: Props) {
  const [season, setSeason] = useState(seasons[0].id);
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer text-primary">Отметить просмотренное по серию…</summary>
      <p className="my-2 text-muted-foreground">Будут отмечены все пункты текущего маршрута до выбранной серии включительно, в том числе фильмы и ОВА по пути.</p>
      <form className="flex flex-wrap gap-2" onSubmit={event => {
        event.preventDefault();
        const items = rows.flatMap(row => row.items);
        const end = items.findIndex(item => item.key === `${season}s${Number(number)}`);
        if (end < 0) {
          setMessage('Эта серия не входит в выбранный маршрут.');
          return;
        }
        onMark(items.slice(0, end + 1), true);
        setMessage(`Отмечено по серию ${number} включительно.`);
      }}>
        <select aria-label="Сезон для отметки" value={season} onChange={event => {
          setSeason(Number(event.target.value));
          setMessage('');
        }} className="max-w-full rounded border bg-card p-2">
          {seasons.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="number" min="1" required value={number} placeholder="Серия"
          aria-label="Последняя просмотренная серия" onChange={event => {
            setNumber(event.target.value);
            setMessage('');
          }} className="w-24 rounded border bg-card p-2" />
        <button className="rounded border px-3">Отметить</button>
      </form>
      <span role="status">{message}</span>
    </details>
  );
}
