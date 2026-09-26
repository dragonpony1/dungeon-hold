// Dungeon Hold — Cloudflare Worker + Durable Object.
// Serves the static game/hideout files and backs the Hideout's shared
// "dropped gear" display: mythic/unique gear anyone drops in the room is
// stored here so every visitor sees the same table, not just the browser
// that dropped it.

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

// The main game serves its own copy of the hideout from GitHub Pages, so the shared-gear
// calls arrive cross-origin from there.
const ALLOWED_ORIGINS = new Set(['https://dragonpony1.github.io']);
function corsHeaders(request) {
  const origin = request.headers.get('origin');
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
    'vary': 'origin',
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/hideout/')) {
      const cors = corsHeaders(request);
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
      const stub = env.HIDEOUT.get(env.HIDEOUT.idFromName('main'));
      const res = await stub.fetch(request);
      if (!Object.keys(cors).length) return res;
      const out = new Response(res.body, res);
      for (const [k, v] of Object.entries(cors)) out.headers.set(k, v);
      return out;
    }
    return env.ASSETS.fetch(request);
  },
};

// kind: 'forged' (a mythic/unique from the hideout's forge — type is the category, tier is mythic|unique)
//    or 'carried' (a trophy locked in the dungeon and carried through the portal — type is the slot,
//    tier is the rarity name, payload is the game's full item record so it survives the round trip)
function rowToItem(row) {
  return {
    id: row.id, kind: row.kind || 'forged', type: row.type, tier: row.tier, name: row.name,
    payload: row.payload ? JSON.parse(row.payload) : null,
    x: row.x, y: row.y, z: row.z, ry: row.ry,
    droppedBy: row.dropped_by, locked: !!row.locked, createdAt: row.created,
  };
}

export class HideoutDO {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.sql = ctx.storage.sql;
    ctx.blockConcurrencyWhile(async () => {
      this.sql.exec(`CREATE TABLE IF NOT EXISTS dropped_gear(
        id TEXT PRIMARY KEY, type TEXT NOT NULL, tier TEXT NOT NULL, name TEXT,
        x REAL, y REAL, z REAL, ry REAL,
        dropped_by TEXT DEFAULT '', locked INTEGER DEFAULT 0, created INTEGER,
        kind TEXT DEFAULT 'forged', payload TEXT)`);
      // upgrade path for the live table, created before carried-in trophies existed
      try { this.sql.exec("ALTER TABLE dropped_gear ADD COLUMN kind TEXT DEFAULT 'forged'"); } catch { /* already there */ }
      try { this.sql.exec('ALTER TABLE dropped_gear ADD COLUMN payload TEXT'); } catch { /* already there */ }
    });
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/api/hideout/gear') {
      const rows = this.sql.exec('SELECT * FROM dropped_gear ORDER BY created ASC').toArray();
      return json({ items: rows.map(rowToItem) });
    }

    if (request.method === 'POST' && url.pathname === '/api/hideout/gear') {
      const body = await request.json().catch(() => null);
      if (!body || !body.type || !body.tier) return json({ error: 'type and tier required' }, 400);
      const kind = body.kind === 'carried' ? 'carried' : 'forged';
      const payload = kind === 'carried' && body.payload && typeof body.payload === 'object' ? JSON.stringify(body.payload) : null;
      if (kind === 'carried' && !payload) return json({ error: 'a carried item needs its payload' }, 400);
      if (payload && payload.length > 8000) return json({ error: 'payload too large' }, 400);
      const id = crypto.randomUUID();
      const now = Date.now();
      this.sql.exec(
        'INSERT INTO dropped_gear(id,type,tier,name,x,y,z,ry,dropped_by,locked,created,kind,payload) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',
        id, String(body.type), String(body.tier), body.name || null,
        Number(body.x) || 0, Number(body.y) || 0, Number(body.z) || 0, Number(body.ry) || 0,
        String(body.droppedBy || ''), 0, now, kind, payload);
      const row = this.sql.exec('SELECT * FROM dropped_gear WHERE id = ?', id).toArray()[0];
      return json({ item: rowToItem(row) });
    }

    const pickupMatch = url.pathname.match(/^\/api\/hideout\/gear\/([^/]+)\/pickup$/);
    if (request.method === 'POST' && pickupMatch) {
      const id = pickupMatch[1];
      const row = this.sql.exec('SELECT * FROM dropped_gear WHERE id = ?', id).toArray()[0];
      if (!row) return json({ error: 'already gone' }, 404);
      if (row.locked) return json({ error: 'locked' }, 403);
      this.sql.exec('DELETE FROM dropped_gear WHERE id = ?', id);
      return json({ item: rowToItem(row) });
    }

    return json({ error: 'not found' }, 404);
  }
}
