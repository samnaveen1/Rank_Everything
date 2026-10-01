const normalizeWord = (word: string): string => {
  const lower = word.toLowerCase();
  if (word === lower || word === word.toUpperCase()) {
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  return word.charAt(0).toUpperCase() + word.slice(1);
};

/**
 * Title-cases a label while preserving deliberate inner casing, so "movies"
 * becomes "Movies" but "Sci-Fi" and "Indian cinema" stay readable.
 */
export const titleCase = (value: string): string =>
  value.replace(/[^\s\-/&]+/g, normalizeWord);

export const titleCaseAll = (values: readonly string[]): string[] => values.map(titleCase);

/** 2100 -> "2.1k", 1_450_000 -> "1.5M", 42 -> "42". */
export const formatCount = (value: number): string => {
  if (!Number.isFinite(value) || value < 0) {
    return '0';
  }
  if (value < 1000) {
    return String(Math.round(value));
  }
  if (value < 1_000_000) {
    const thousands = value / 1000;
    return `${thousands >= 100 ? Math.round(thousands) : Math.round(thousands * 10) / 10}k`;
  }
  return `${Math.round((value / 1_000_000) * 10) / 10}M`;
};

export const formatRating = (value: number): string => (Math.round(value * 10) / 10).toFixed(1);

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const formatRelativeTime = (isoDate: string): string => {
  const timestamp = Date.parse(isoDate);
  if (Number.isNaN(timestamp)) {
    return '';
  }
  const elapsed = Date.now() - timestamp;
  if (elapsed < MINUTE) {
    return 'just now';
  }
  if (elapsed < HOUR) {
    return `${Math.floor(elapsed / MINUTE)}m ago`;
  }
  if (elapsed < DAY) {
    return `${Math.floor(elapsed / HOUR)}h ago`;
  }
  if (elapsed < 7 * DAY) {
    return `${Math.floor(elapsed / DAY)}d ago`;
  }
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
