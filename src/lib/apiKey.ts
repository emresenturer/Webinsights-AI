const STORAGE_KEY = 'gemini_api_key';

export function getApiKey(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch {
    // storage blocked (private mode); fall through
  }
  return (process.env.GEMINI_API_KEY as string | undefined) || '';
}

export function setApiKey(key: string) {
  try { localStorage.setItem(STORAGE_KEY, key.trim()); } catch { /* ignore */ }
}

export function clearApiKey() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}
