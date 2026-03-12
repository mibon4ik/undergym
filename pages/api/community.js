import { put, head, list } from '@vercel/blob';

const BLOB_KEY = 'uf-community-data.json';

const hasBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

// Read all objections from Blob Store
async function readData() {
  try {
    // List blobs to find our data file
    const { blobs } = await list({ prefix: 'uf-community', token: process.env.BLOB_READ_WRITE_TOKEN });
    
    if (!blobs || blobs.length === 0) return [];

    // Find the latest version of our data file
    const dataBlob = blobs.find(b => b.pathname === BLOB_KEY);
    if (!dataBlob) return [];

    // Fetch the blob content
    const response = await fetch(dataBlob.url);
    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('readData error:', e);
    return [];
  }
}

// Write all objections to Blob Store (overwrite)
async function writeData(objections) {
  await put(BLOB_KEY, JSON.stringify(objections), {
    access: 'public',
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // GET — list all
  if (req.method === 'GET') {
    if (!hasBlob()) return res.json({ objections: [], noBlob: true });
    try {
      const objections = await readData();
      const sorted = [...objections].sort((a, b) => (b.votes || 0) - (a.votes || 0));
      return res.json({ objections: sorted });
    } catch (e) {
      return res.json({ objections: [], error: e.message });
    }
  }

  // POST — add new objection
  if (req.method === 'POST') {
    if (!hasBlob()) {
      return res.status(503).json({
        error: 'Vercel Blob не подключён. Добавь BLOB_READ_WRITE_TOKEN в переменные окружения.',
      });
    }
    try {
      const existing = await readData();
      const obj = {
        ...req.body,
        id: `obj_${Date.now()}`,
        votes: 0,
        createdAt: new Date().toISOString(),
      };
      await writeData([obj, ...existing]);
      return res.json({ ok: true, objection: obj });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  // PATCH — vote
  if (req.method === 'PATCH') {
    if (!hasBlob()) return res.status(503).json({ error: 'Blob не подключён' });
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'id required' });
    try {
      const existing = await readData();
      const idx = existing.findIndex(o => o.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Not found' });

      existing[idx] = { ...existing[idx], votes: (existing[idx].votes || 0) + 1 };
      await writeData(existing);
      return res.json({ ok: true, votes: existing[idx].votes });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  res.status(405).end();
}
