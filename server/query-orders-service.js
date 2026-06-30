import dotenv from 'dotenv';
dotenv.config();

import { listWorkspaceOrdersForUser } from './src/services/order.service.js';

async function run() {
  const user = {
    id: 'some-user-id',
    workspaceId: '60f7c52e-b086-4144-994b-a1260ee00ec9',
    role: 'owner',
  };
  const result = await listWorkspaceOrdersForUser({
    user,
    chatId: 'c3dbb8bb-a89c-4ee9-9ad6-5bf69e40dc67',
    contactId: '4f7a1f80-edef-497a-9a10-4614c8297606',
  });
  console.log('Result for mridhoda:');
  console.log('Total orders count:', result.meta.total);
  console.log('Orders data length:', result.data.length);
  console.log('Orders customer snapshots:', result.data.map(o => o.customerNameSnapshot));
}
run();
