// The browser cannot call Anthropic directly: the request needs an API key,
// and a key shipped to the browser is a key anyone can read out of the
// JavaScript and spend. So the call is made here instead, on Vercel, where
// ANTHROPIC_API_KEY stays server-side and never reaches the page.

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'This endpoint only accepts POST.' } });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: {
        message: 'This site has no ANTHROPIC_API_KEY set. Add it in the Vercel project settings and redeploy.',
      },
    });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body),
    });

    // Pass the model's own error through rather than flattening it, so the
    // page can say what actually went wrong.
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (e) {
    return res.status(502).json({
      error: { message: `Could not reach the model: ${e.message}` },
    });
  }
}
