import { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Loader2, XCircle } from 'lucide-react';
import { PROVIDERS, getApiKey, looksLikeApiKey, providerOf } from '../lib/apikey';
import { useLedger } from '../lib/ledger';

// Reading papers costs money on some providers and nothing on others, so the
// key belongs to whoever is reading them. Pasting it here puts it on the
// account rather than in the site's build — the difference between your key
// and everybody's key — and asking once rather than once per device.
export default function ApiKeyDialog({ onClose }) {
  const { saveReaderKey } = useLedger();
  const [value, setValue] = useState(getApiKey());
  const [touched, setTouched] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const trimmed = value.trim();
  const provider = providerOf(trimmed);
  const valid = trimmed === '' || looksLikeApiKey(trimmed);

  // Whether a key is the right shape and whether the provider will accept it
  // are different questions, and only the second one matters. This asks it, for
  // the price of about twenty tokens, rather than leaving it to be discovered
  // on an upload that quietly falls back to reading the PDF instead.
  const test = async () => {
    setTesting(true);
    setResult(null);
    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-api-key': trimmed },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 16,
          messages: [{ role: 'user', content: [{ type: 'text', text: 'Reply with the word OK.' }] }],
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setResult({ ok: false, message: data?.error?.message || `The provider refused it (${response.status}).` });
      } else {
        setResult({ ok: true, message: 'Working — the provider accepted it and answered.' });
      }
    } catch (e) {
      setResult({ ok: false, message: `Could not reach the reader: ${e.message}` });
    } finally {
      setTesting(false);
    }
  };

  const save = () => {
    saveReaderKey(trimmed);
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
          <h2 className="font-serif text-lg text-stone-900">Reader key</h2>
        </div>

        <p className="text-sm text-stone-600 mb-3">
          Reading a marked paper sends it to a model, which needs a key. Paste either kind — the app works
          out which it is.
        </p>

        <div className="flex flex-col gap-2 mb-3 text-xs">
          <a
            href="https://aistudio.google.com/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-baseline gap-2 p-2.5 border border-stone-300 rounded"
          >
            <span className="font-medium text-stone-800">Google AI Studio</span>
            <span className="px-1.5 py-0.5 rounded border border-emerald-500 text-emerald-700 text-[10px] font-mono">FREE</span>
            <span className="flex-1 text-stone-500 text-right underline">aistudio.google.com</span>
          </a>
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-baseline gap-2 p-2.5 border border-stone-300 rounded"
          >
            <span className="font-medium text-stone-800">Anthropic Console</span>
            <span className="px-1.5 py-0.5 rounded border border-stone-300 text-stone-500 text-[10px] font-mono">PAID</span>
            <span className="flex-1 text-stone-500 text-right underline">console.anthropic.com</span>
          </a>
        </div>

        <input
          type="password"
          autoFocus
          value={value}
          onChange={e => { setValue(e.target.value); setTouched(true); setResult(null); }}
          onKeyDown={e => e.key === 'Enter' && valid && save()}
          placeholder="AQ.… or AIza… or sk-ant-…"
          className="w-full border border-stone-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-400"
        />

        {provider && (
          <p className="text-xs text-emerald-700 mt-1.5">
            Recognised as a {PROVIDERS[provider].name} key ({PROVIDERS[provider].note}).
          </p>
        )}
        {touched && !valid && !provider && (
          <p className="text-xs text-rose-600 mt-1.5">
            Not a key either provider issues — Google's begin AQ. or AIza, Anthropic's sk-ant-.
          </p>
        )}

        <p className="text-xs text-stone-500 mt-3">
          Saved to your account, so it works on every device you sign in on — add it once and never
          again. It is never built into the site, so nobody else visiting it can use your key. Clear the
          box and save to remove it everywhere.
        </p>

        {provider === 'gemini' && (
          <p className="text-xs text-stone-500 mt-2">
            On Google's free tier, uploads may be used to improve their models, and there is a limit of a
            few requests a minute.
          </p>
        )}

        {result && (
          <p className={`flex items-start gap-1.5 text-xs mt-3 leading-relaxed ${result.ok ? 'text-emerald-700' : 'text-rose-600'}`}>
            {result.ok
              ? <CheckCircle2 size={13} className="shrink-0 mt-0.5" />
              : <XCircle size={13} className="shrink-0 mt-0.5" />}
            <span>{result.message}</span>
          </p>
        )}

        <div className="flex items-center gap-2 mt-4">
          <button
            data-tappable
            onClick={test}
            disabled={!trimmed || !valid || testing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-stone-700 border border-stone-300 rounded disabled:text-stone-300 disabled:border-stone-200"
          >
            {testing && <Loader2 size={13} className="animate-spin" />}
            {testing ? 'Testing…' : 'Test it'}
          </button>
          <span className="flex-1" />
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
