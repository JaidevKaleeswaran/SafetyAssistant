import { type ClassValue, clsx } from 'clsx';

// Tailwind class merger utility (simplified without tailwind-merge for now)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Pick N unique random items from an array */
export function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/** Random integer between min (inclusive) and max (inclusive) */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Delay helper */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Generate N unique random grid positions */
export function randomGridPositions(gridSize: number, count: number): number[] {
  const total = gridSize * gridSize;
  const positions: number[] = [];
  while (positions.length < count) {
    const pos = Math.floor(Math.random() * total);
    if (!positions.includes(pos)) {
      positions.push(pos);
    }
  }
  return positions;
}
