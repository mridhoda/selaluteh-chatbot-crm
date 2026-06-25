const clients = new Map();

function clientKey({ workspaceId, userId }) {
  return `${workspaceId}:${userId}`;
}

export function addRealtimeClient({ workspaceId, userId, res }) {
  const key = clientKey({ workspaceId, userId });
  const set = clients.get(key) || new Set();
  set.add(res);
  clients.set(key, set);

  res.on('close', () => {
    set.delete(res);
    if (set.size === 0) clients.delete(key);
  });
}

export function sendRealtimeEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function broadcastToWorkspace({ workspaceId, event, data }) {
  let sent = 0;
  for (const [key, set] of clients.entries()) {
    if (!key.startsWith(`${workspaceId}:`)) continue;
    for (const res of set) {
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
