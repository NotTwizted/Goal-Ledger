// Reading a paper needs an Anthropic API key. There are two places it can
// come from: ANTHROPIC_API_KEY set on the server, which suits a site several
// people use, or one pasted into this browser, which suits a site used by the
// person who owns the key.
//
// A key kept here stays in this browser. It is sent to this site's own
// /api/extract with each request and forwarded from there, so it is never
// built into the JavaScript that every visitor downloads — which is what
// putting it in a VITE_ variable would do.

const STORAGE_KEY = 'study-tracker:anthropic-key';

export function getApiKey() {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch (e) {
    return '';
  }
}

export function setApiKey(key) {
  try {
    const trimmed = (key || '').trim();
    if (trimmed) localStorage.setItem(STORAGE_KEY, trimmed);
    else localStorage.removeItem(STORAGE_KEY);
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

export function looksLikeAnthropicKey(key) {
  return /^sk-ant-[A-Za-z0-9\-_]{20,}$/.test((key || '').trim());
}
