import 'dotenv/config';
import { connectSupabase } from '../../src/db/supabase.js';
import { telegramBackfillService } from '../../src/services/telegram/telegram-backfill.service.js';

await connectSupabase();
const result = await telegramBackfillService.backfillLegacyTelegramPlatforms();
console.log(JSON.stringify(result, null, 2));
