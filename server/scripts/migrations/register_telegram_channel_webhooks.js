import 'dotenv/config';
import { connectSupabase } from '../../src/db/supabase.js';
import { channelConnectionsRepository } from '../../src/db/repositories/index.js';
import { telegramConnectionService } from '../../src/services/telegram/telegram-connection.service.js';

await connectSupabase();
const connections = await channelConnectionsRepository.listActiveByProvider({ provider: 'TELEGRAM' });
const result = { scanned: connections.length, registered: 0, errors: [] };

for (const connection of connections) {
  try {
    await telegramConnectionService.reconnectTelegramWebhook({
      workspaceId: connection.workspaceId,
      connectionId: connection.id,
    });
    result.registered += 1;
  } catch (error) {
    result.errors.push({ connectionId: connection.id, message: error?.message || String(error) });
  }
}

console.log(JSON.stringify(result, null, 2));
