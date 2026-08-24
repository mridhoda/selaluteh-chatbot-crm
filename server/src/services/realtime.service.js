const clients = new Map();
const clientScopes = new WeakMap();

function clientKey({ workspaceId, userId }) {
  return `${workspaceId}:${userId}`;
}

export function addRealtimeClient({ workspaceId, userId, allowedOutletIds = [], res }) {
  const key = clientKey({ workspaceId, userId });
  const set = clients.get(key) || new Set();
  set.add(res);
  clients.set(key, set);
  clientScopes.set(res, {
    allowedOutletIds: new Set((allowedOutletIds || []).map((id) => String(id))),
  });

  res.on('close', () => {
    set.delete(res);
    clientScopes.delete(res);
    if (set.size === 0) clients.delete(key);
  });
}

export function sendRealtimeEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function broadcastToWorkspace({ workspaceId, event, data }) {
  let sent = 0;
  const outletId = data?.outletId || data?.outlet_id || data?.order?.outletId || data?.order?.outlet_id || data?.payment?.outletId || data?.payment?.outlet_id;
  for (const [key, set] of clients.entries()) {
    if (!key.startsWith(`${workspaceId}:`)) continue;
    for (const res of set) {
      if (outletId) {
        const scope = clientScopes.get(res);
        if (!scope?.allowedOutletIds?.has(String(outletId))) continue;
      }
      sendRealtimeEvent(res, event, data);
      sent += 1;
    }
  }
  return { sent };
}

export function getRealtimeClientCount() {
  let count = 0;
  for (const set of clients.values()) count += set.size;
  return count;
}

// Public per-order channel (customer status page) -- keyed by publicOrderToken
// instead of workspaceId:userId. The per-token key IS the isolation boundary:
// a client registered under token X cannot physically receive a broadcast
// addressed to token Y, no runtime outlet-style filter needed or to get wrong.
const publicOrderClients = new Map();

export function addPublicOrderClient({ publicOrderToken, res }) {
  const set = publicOrderClients.get(publicOrderToken) || new Set();
  set.add(res);
  publicOrderClients.set(publicOrderToken, set);

  res.on('close', () => {
    set.delete(res);
    if (set.size === 0) publicOrderClients.delete(publicOrderToken);
  });
}

export function broadcastToPublicOrder({ publicOrderToken, event, data }) {
  const set = publicOrderClients.get(publicOrderToken);
  if (!set) return { sent: 0 };
  let sent = 0;
  for (const res of set) {
    sendRealtimeEvent(res, event, data);
    sent += 1;
  }
  return { sent };
}
