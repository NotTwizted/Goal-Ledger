import { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { getApiKey, looksLikeAnthropicKey, setApiKey } from '../lib/apikey';

// Reading papers costs money, so the key belongs to whoever is reading them.
// Pasting it here keeps it in this browser rather than in the site's build,
// which is the difference between your key and everybody's key.
export default function ApiKeyDialog({ onClose }) {
  const [value, setValue] = useState(getApiKey());
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const trimmed = value.trim();
  const valid = trimmed === '' || looksLikeAnthropicKey(trimmed);

  const save = () => {
    setApiKey(trimmed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-6" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white border-2 border-stone-800 rounded-xl p-5 shadow-lg"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-2">
          <KeyRound size={18} className="shrink-0 text-stone-700" />
          <h2 className="font-serif text-lg text-stone-900">Anthropic API key</h2>
        </div>

        <p className="text-sm text-stone-600 mb-3">
          Reading a marked paper sends it to Claude, which needs a key of your own. Get one at{' '}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-stone-800"
          >
            console.anthropic.com
          </a>
          . A paper costs a few pence to read.
        </p>

        <input
          type="password"
          autoFocus
          value={value}
          onChange={e => { setValue(e.target.value); setTouched(true); }}
          onKeyDown={e => e.key === 'Enter' && valid && save()}
          placeholder="sk-ant-…"
          className="w-full border border-stone-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-400"
        />

        {touched && !valid && (
          <p className="text-xs text-rose-600 mt-1.5">
            That does not look like an Anthropic key — they begin with sk-ant-.
          </p>
        )}

        <p className="text-xs text-stone-500 mt-3">
          The key is kept in this browser and sent with each upload. It is never built into the site, so
          nobody else visiting it can use your key. Clear the box and save to remove it.
        </p>

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-stone-600 border border-stone-300 rounded">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!valid}
            className="px-3 py-1.5 text-sm text-white bg-stone-800 rounded font-medium disabled:bg-stone-300"
          >
            {trimmed ? 'Save key' : 'Remove key'}
          </button>
        </div>
      </div>
    </div>
  );
}
