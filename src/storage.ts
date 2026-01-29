import { LocalStorage } from "@raycast/api";

const HISTORY_KEY = "python-history";
const MAX_ENTRIES = 50;

export interface HistoryEntry {
  code: string;
  timestamp: number;
}

export async function getHistory(): Promise<HistoryEntry[]> {
  const raw = await LocalStorage.getItem<string>(HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

export async function addToHistory(code: string): Promise<void> {
  const history = await getHistory();
  const filtered = history.filter((e) => e.code !== code);
  filtered.unshift({ code, timestamp: Date.now() });
  await LocalStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, MAX_ENTRIES)));
}

export async function removeFromHistory(timestamp: number): Promise<void> {
  const history = await getHistory();
  const filtered = history.filter((e) => e.timestamp !== timestamp);
  await LocalStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
}

export async function clearHistory(): Promise<void> {
  await LocalStorage.removeItem(HISTORY_KEY);
}

export function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
