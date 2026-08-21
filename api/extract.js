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

  return {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      maxOutputTokens: body?.max_tokens || 4000,
      // The app asks for JSON and parses it; leaving room for reasoning tokens
      // is what stops a long paper coming back truncated.
      temperature: 0,
    },
  };
}

function fromGeminiResponse(data) {
  const candidate = data?.candidates?.[0];
  const text = (candidate?.content?.parts || []).map(p => p.text || '').join('\n');
  return {
    content: [{ type: 'text', text }],
    stop_reason: candidate?.finishReason === 'MAX_TOKENS' ? 'max_tokens' : 'end_turn',
  };
}

async function callGemini(apiKey, body) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(toGeminiRequest(body)),
  });

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
      payload: { error: { message: `The model returned nothing${reason ? ` (${reason})` : ''}. Try a clearer scan.` } },
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
