import { kv } from '@vercel/kv';

const hasKV = () => !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // GET — list all
  if (req.method === 'GET') {
    if (!hasKV()) return res.json({ objections: [], noKV: true });
    try {
      const data = await kv.hgetall('uf_community');
      if (!data) return res.json({ objections: [] });
      const objections = Object.values(data)
        .map(v => (typeof v === 'string' ? JSON.parse(v) : v))
        .sort((a, b) => (b.votes || 0) - (a.votes || 0));
      res.json({ objections });
    } catch (e) {
      res.json({ objections: [], error: e.message });
    }
    return;
  }

  // POST — add new
  if (req.method === 'POST') {
    if (!hasKV()) return res.status(503).json({ error: 'Vercel KV не подключён. Добавь KV_REST_API_URL и KV_REST_API_TOKEN в переменные окружения.' });
    try {
      const obj = {
        ...req.body,
        id: `obj_${Date.now()}`,
        votes: 0,
        createdAt: new Date().toISOString(),
      };
      await kv.hset('uf_community', { [obj.id]: JSON.stringify(obj) });
      res.json({ ok: true, objection: obj });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  // PATCH — vote
  if (req.method === 'PATCH') {
    if (!hasKV()) return res.status(503).json({ error: 'KV не подключён' });
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });
    try {
      const raw = await kv.hget('uf_community', id);
      if (!raw) return res.status(404).json({ error: 'Not found' });
      const obj = typeof raw === 'string' ? JSON.parse(raw) : raw;
      obj.votes = (obj.votes || 0) + 1;
      await kv.hset('uf_community', { [id]: JSON.stringify(obj) });
      res.json({ ok: true, votes: obj.votes });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }

  res.status(405).end();
}
