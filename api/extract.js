// The browser cannot call a model provider directly: the request needs an API
// key, and a key shipped to the browser is a key anyone can read out of the
// JavaScript and spend. So the call is made here, where the key stays.
//
// Two providers are supported and the key itself says which is which — an
// Anthropic key begins "sk-ant-", a Google one "AIza" or "AQ." depending on
// when it was issued. The app sends the same request either way and gets the
// same shape back, so nothing else has to know which one read the paper.

export const config = { maxDuration: 60 };

// Google retires models for new keys without retiring them for old ones, so a
// name that works today can refuse a key issued tomorrow. GEMINI_MODEL
// overrides this without a deploy when that happens again.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// What a thinking model may spend on reasoning before it starts answering.
const THINKING_HEADROOM = 8000;

const GOOGLE_PREFIXES = ['AIza', 'AQ.'];
const providerOf = (key) =>
  (GOOGLE_PREFIXES.some(prefix => String(key || '').startsWith(prefix)) ? 'gemini' : 'anthropic');

// Anthropic's message shape is what the app speaks; this turns one request
// into Google's equivalent. A document or image block becomes inline data, and
// the prompt becomes a text part alongside it.
function toGeminiRequest(body) {
  const blocks = body?.messages?.[0]?.content || [];
  const parts = (Array.isArray(blocks) ? blocks : [{ type: 'text', text: String(blocks) }])
    .map(block => {
      if (block.type === 'text') return { text: block.text };
      if (block.type === 'document' || block.type === 'image') {
        return { inline_data: { mime_type: block.source?.media_type, data: block.source?.data } };
      }
      return null;
    })
    .filter(Boolean);

  // Google's newer models think before they answer, and the thinking is spent
  // out of the same budget as the reply. A request for 16 tokens came back
  // empty with MAX_TOKENS — all of it had gone on reasoning. So the budget sent
  // is the answer the app asked for plus room to think first.
  const asked = body?.max_tokens || 4000;

  return {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      maxOutputTokens: asked + THINKING_HEADROOM,
      // The app asks for JSON and parses it, so there is nothing to be gained
      // from variety.
      temperature: 0,
      // Reading marks off a page is not a problem that rewards long reasoning,
      // and the reasoning is most of the wait. Dropped from the request if the
      // model does not know the field.
      thinkingConfig: { thinkingLevel: 'low' },
    },
  };
}

// Not every model takes thinkingConfig, and one that does not says so with a
// 400 rather than ignoring it. Rather than keep a list of which models accept
// what, the request is simply sent again without it.
function withoutThinkingConfig(request) {
  const { thinkingConfig, ...generationConfig } = request.generationConfig || {};
  if (!thinkingConfig) return null;
  return { ...request, generationConfig };
}

function fromGeminiResponse(data) {
  const candidate = data?.candidates?.[0];
  const text = (candidate?.content?.parts || []).map(p => p.text || '').join('\n');
  return {
    content: [{ type: 'text', text }],
    stop_reason: candidate?.finishReason === 'MAX_TOKENS' ? 'max_tokens' : 'end_turn',
  };
}

const postGemini = (apiKey, request, model = GEMINI_MODEL) =>
  fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(request),
  });

// "This model is currently experiencing high demand" is Google saying come
// back in a moment, not that anything is wrong with the request. Coming back
// in a moment is therefore what to do, rather than handing the reader a paper
// it could not read.
const BUSY = new Set([429, 500, 502, 503, 504]);
const WAITS = [2000, 6000];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callGemini(apiKey, body) {
  const request = toGeminiRequest(body);
  let upstream = await postGemini(apiKey, request);

  if (upstream.status === 400) {
    const plain = withoutThinkingConfig(request);
    if (plain) upstream = await postGemini(apiKey, plain);
  }

  for (let attempt = 0; attempt < WAITS.length && BUSY.has(upstream.status); attempt++) {
    await wait(WAITS[attempt]);
    upstream = await postGemini(apiKey, request);
  }

  // A model kept for exactly this: when the usual one stays busy, GEMINI_BUSY_MODEL
  // is tried once before giving up. Unset, nothing changes.
  if (BUSY.has(upstream.status) && process.env.GEMINI_BUSY_MODEL) {
    upstream = await postGemini(apiKey, request, process.env.GEMINI_BUSY_MODEL);
  }

  const data = await upstream.json();
  if (!upstream.ok) {
    return { status: upstream.status, payload: { error: { message: data?.error?.message || 'The request was refused.' } } };
  }

  // A refusal or a safety stop comes back as a success with no text in it.
  const converted = fromGeminiResponse(data);
  if (!converted.content[0].text) {
    const reason = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason;
    return {
      status: 502,
      payload: {
        error: {
          message: reason === 'MAX_TOKENS'
            ? 'The model ran out of room before it answered — the file is too long to read in one go. Try splitting it.'
            : `The model returned nothing${reason ? ` (${reason})` : ''}. Try a clearer scan.`,
        },
      },
    };
  }
  return { status: 200, payload: converted };
}

async function callAnthropic(apiKey, body) {
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });
  return { status: upstream.status, payload: await upstream.json() };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'This endpoint only accepts POST.' } });
  }

  // The reader's own key takes precedence; otherwise whichever the site has.
  const apiKey = req.headers['x-user-api-key']
    || process.env.GEMINI_API_KEY
    || process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(401).json({
      error: {
        message: 'No API key. Add one under the three-dot menu — a free Google AI Studio key works.',
      },
    });
  }

  try {
    const { status, payload } = providerOf(apiKey) === 'gemini'
      ? await callGemini(apiKey, req.body)
      : await callAnthropic(apiKey, req.body);
    return res.status(status).json(payload);
  } catch (e) {
    return res.status(502).json({ error: { message: `Could not reach the model: ${e.message}` } });
  }
}
