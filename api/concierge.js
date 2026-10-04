// Vercel Serverless Function: optional AI route helper.
// Set ANTHROPIC_API_KEY in Vercel > Project > Settings > Environment Variables. If it is missing the site simply hides the answer
// (the app shows a friendly "not available" message and the on-device route builder still works).
const MODEL = 'claude-haiku-4-5-20251001';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: 'AI not configured' });
  try {
    const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const prompt = String(b.prompt || '').slice(0, 600);
    if (!prompt.trim()) return res.status(400).json({ error: 'Prompt required' });
    const region = String(b.region || 'Kolkata').slice(0, 100);
    const places = Array.isArray(b.selected) ? b.selected.slice(0, 25).map((p) => ({ name: String(p.name || '').slice(0, 80), metro: String(p.metro || '').slice(0, 60), region: String(p.region || '').slice(0, 60) })) : [];
    const system = `You are a practical Kolkata Durga Puja route helper. Use only the supplied place list as factual place data. Do not invent live crowd conditions, weather, fares, opening hours, accessibility or official links. Clearly label suggestions as suggestions. Keep the answer under 180 words and easy to read on a phone. If the user writes in Bengali or asks for Bengali, answer in Bengali. Region: ${region}. Places: ${JSON.stringify(places)}`;
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 600, system, messages: [{ role: 'user', content: prompt }] })
    });
    if (!r.ok) return res.status(502).json({ error: 'AI provider error' });
    const d = await r.json();
    const answer = (d.content || []).map((x) => x.text || '').join('\n').trim();
    return res.status(200).json({ answer });
  } catch (e) {
    return res.status(500).json({ error: 'Server error' });
  }
};
