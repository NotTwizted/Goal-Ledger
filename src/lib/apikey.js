// Reading a paper needs a key from a model provider. Two are supported, and
// the key says which: Anthropic's begin "sk-ant-", Google's "AIza" or, for the
// ones AI Studio issues now, "AQ.". Nothing has to be chosen from a menu —
// paste any of them and it is recognised.
//
// A key kept here stays in this browser. It is sent to this site's own
// /api/extract with each request and forwarded from there, so it is never
// built into the JavaScript that every visitor downloads — which is what
// putting it in a VITE_ variable would do.

const STORAGE_KEY = 'study-tracker:api-key';
const LEGACY_KEY = 'study-tracker:anthropic-key';

export const PROVIDERS = {
  // Google has issued two shapes of key and both are current: the long-standing
  // "AIza..." and the "AQ..." ones AI Studio hands out now.
  gemini: { name: 'Google Gemini', note: 'free tier', prefixes: ['AIza', 'AQ.'] },
  anthropic: { name: 'Anthropic Claude', note: 'paid', prefixes: ['sk-ant-'] },
};

export function providerOf(key) {
  const value = (key || '').trim();
  return Object.keys(PROVIDERS).find(name =>
    PROVIDERS[name].prefixes.some(prefix => value.startsWith(prefix))) || null;
}

export function getApiKey() {
  try {
    return localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY) || '';
  } catch (e) {
    return '';
  }
}

export function setApiKey(key) {
  try {
    const trimmed = (key || '').trim();
    if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
    else localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_KEY);
  } catch (e) {
    // Private browsing with storage disabled; the key simply will not persist.
  }
}

export function hasApiKey() {
  return getApiKey().length > 0;
}

// Enough to recognise which key is saved without showing it in full.
export function maskApiKey(key = getApiKey()) {
  if (!key) return '';
  return key.length <= 12 ? '••••' : `${key.slice(0, 7)}…${key.slice(-4)}`;
}

export function providerLabel(key = getApiKey()) {
  const provider = providerOf(key);
  return provider ? PROVIDERS[provider].name : '';
}

export function looksLikeApiKey(key) {
  const value = (key || '').trim();
  return /^sk-ant-[A-Za-z0-9\-_]{20,}$/.test(value)
    || /^AIza[A-Za-z0-9\-_]{20,}$/.test(value)
    || /^AQ\.[A-Za-z0-9\-_.]{20,}$/.test(value);
}
