import { Redis } from '@upstash/redis';

// Works with either the Vercel KV / Upstash integration env vars
// (KV_REST_API_URL / KV_REST_API_TOKEN) or the raw Upstash ones
// (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
  // The app stores JSON strings itself, so keep values as raw strings
  // (do not let the client auto-parse them).
  automaticDeserialization: false,
});

// Namespace keys so shared data is global and personal data is per-device.
function ns(shared, clientId) {
  return shared ? 's:' : 'p:' + (clientId || 'anon') + ':';
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return req.body;
}

// Core logic, decoupled from the HTTP layer and the concrete client so it
// can be unit-tested with an in-memory mock. Returns { status, body }.
export async function handleStorage(client, body) {
  const { op, key, value, prefix, shared, clientId } = body || {};
  const prefixNs = ns(shared, clientId);

  if (op === 'get') {
    const v = await client.get(prefixNs + key);
    if (v === null || v === undefined) return { status: 200, body: null };
    return { status: 200, body: { key: key, value: v, shared: !!shared } };
  }

  if (op === 'set') {
    await client.set(prefixNs + key, value);
    return { status: 200, body: { key: key, value: value, shared: !!shared } };
  }

  if (op === 'delete') {
    await client.del(prefixNs + key);
    return { status: 200, body: { key: key, deleted: true, shared: !!shared } };
  }

  if (op === 'list') {
    const pattern = prefixNs + (prefix || '') + '*';
    let cursor = '0';
    const found = [];
    do {
      const [next, batch] = await client.scan(cursor, { match: pattern, count: 200 });
      cursor = String(next);
      for (const k of batch) { found.push(k.slice(prefixNs.length)); }
    } while (cursor !== '0');
    return { status: 200, body: { keys: found, prefix: prefix || '', shared: !!shared } };
  }

  return { status: 400, body: { error: 'unknown op: ' + op } };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }
  try {
    const { status, body } = await handleStorage(redis, parseBody(req));
    res.status(status).json(body);
  } catch (e) {
    res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
}
