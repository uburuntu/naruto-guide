// Shared types and constants for all series
// Series-specific data lives in ./series/*.ts

export type MarkerType = 'С' | 'П' | 'Ф1' | 'Ф2' | 'Ф3' | 'Ф4' | 'ФН' | 'С+Ф1' | 'С+Ф2' | 'С+Ф3' | 'С+Ф4' | 'С+ФН';

export interface Episode {
  id: number;
  marker: MarkerType;
  episodes: string;
  title: string;
  type: 'series' | 'film' | 'ova';
  season: number;
  releaseDate?: string;
  note?: string;
}

export const MARKERS: Record<MarkerType, { label: string; color: string; bgColor: string; description: string }> = {
  'С': { label: 'С', color: '#22c55e', bgColor: 'rgba(34,197,94,0.15)', description: 'Сюжетные серии — обязательны к просмотру' },
  'П': { label: 'П', color: '#6b7280', bgColor: 'rgba(107,114,128,0.15)', description: 'Серии-повторки — можно пропускать' },
  'Ф1': { label: 'Ф1', color: '#f97316', bgColor: 'rgba(249,115,22,0.15)', description: 'Особо рекомендуемые филлеры' },
  'Ф2': { label: 'Ф2', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.15)', description: 'Нормальные филлеры' },
  'Ф3': { label: 'Ф3', color: '#a855f7', bgColor: 'rgba(168,85,247,0.15)', description: 'Посредственные филлеры' },
  'Ф4': { label: 'Ф4', color: '#ef4444', bgColor: 'rgba(239,68,68,0.15)', description: 'НЕ рекомендуемые филлеры' },
  'ФН': { label: 'ФН', color: '#eab308', bgColor: 'rgba(234,179,8,0.15)', description: 'Экранизации графических новелл' },
  'С+Ф1': { label: 'С+Ф1', color: '#22c55e', bgColor: 'rgba(34,197,94,0.10)', description: 'Смешанные: сюжет + рекомендуемые филлеры' },
  'С+Ф2': { label: 'С+Ф2', color: '#22c55e', bgColor: 'rgba(34,197,94,0.08)', description: 'Смешанные: сюжет + нормальные филлеры' },
  'С+Ф3': { label: 'С+Ф3', color: '#22c55e', bgColor: 'rgba(34,197,94,0.06)', description: 'Смешанные: сюжет + посредственные филлеры' },
  'С+Ф4': { label: 'С+Ф4', color: '#22c55e', bgColor: 'rgba(34,197,94,0.06)', description: 'Смешанные: сюжет + нерекомендуемые филлеры' },
  'С+ФН': { label: 'С+ФН', color: '#22c55e', bgColor: 'rgba(34,197,94,0.10)', description: 'Смешанные: сюжет + графические новеллы' },
};

export interface WatchMode {
  id: string;
  name: string;
  shortName: string;
  episodes: string;
  description: string;
  markers: MarkerType[];
  icon: string;
}
