import { C } from '../theme/colors';

export function getInitials(name: string, fallback = '?'): string {
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  return trimmed.split(' ').map(w => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || fallback;
}

export function scoreColor(v: number): string {
  if (v <= 8)  return C.red;
  if (v <= 11) return C.orange;
  if (v <= 15) return C.greenLight;
  return C.green;
}

/** Type-safe percentage string for React Native dynamic width/height styles. */
export function pct(n: number): `${number}%` {
  return `${n}%`;
}
