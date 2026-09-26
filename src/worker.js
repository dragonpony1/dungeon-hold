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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/hideout/')) {
      const stub = env.HIDEOUT.get(env.HIDEOUT.idFromName('main'));
      return stub.fetch(request);
    }
    return env.ASSETS.fetch(request);
  },
};

function rowToItem(row) {
  return {
    id: row.id, type: row.type, tier: row.tier, name: row.name,
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
        dropped_by TEXT DEFAULT '', locked INTEGER DEFAULT 0, created INTEGER)`);
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
      const id = crypto.randomUUID();
      const now = Date.now();
      this.sql.exec(
        'INSERT INTO dropped_gear(id,type,tier,name,x,y,z,ry,dropped_by,locked,created) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
        id, String(body.type), String(body.tier), body.name || null,
        Number(body.x) || 0, Number(body.y) || 0, Number(body.z) || 0, Number(body.ry) || 0,
        String(body.droppedBy || ''), 0, now);
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
