import { useState, type ReactNode } from 'react';
import { getApiKey, setApiKey, clearApiKey } from '../lib/apiKey';

export function KeyGate({ appName, children }: { appName: string; children: ReactNode }) {
  const [key, setKey] = useState(getApiKey());
  const [draft, setDraft] = useState('');

  if (key) {
    return (
      <>
        {children}
        <button
          type="button"
          onClick={() => { clearApiKey(); setKey(''); }}
          className="fixed bottom-3 right-3 z-50 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white shadow hover:bg-black"
        >
          Change API key
        </button>
      </>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 font-sans text-slate-900">
      <form
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl ring-1 ring-black/5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          setApiKey(draft);
          setKey(draft.trim());
        }}
      >
        <h1 className="text-2xl font-bold tracking-tight">{appName}</h1>
        <p className="mt-2 text-sm text-slate-600">
          This app runs on Google Gemini. Paste your own Gemini API key to start. Get a free key at{' '}
          <a className="font-medium text-sky-700 underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">
            aistudio.google.com/apikey
          </a>.
        </p>
        <label htmlFor="gemini-key" className="mt-6 block text-sm font-semibold">Gemini API key</label>
        <input
          id="gemini-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="AIza..."
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        />
        <button type="submit" className="mt-4 w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white hover:bg-sky-700 disabled:opacity-50" disabled={!draft.trim()}>
          Start
        </button>
        <p className="mt-4 text-xs text-slate-500">
          Your key is stored only in this browser and is sent only to Google's Gemini API. There is no backend.
        </p>
      </form>
    </div>
  );
}
