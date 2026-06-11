
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import Agent from '../src/models/Agent.js';
import Platform from '../src/models/Platform.js';
import Chat from '../src/models/Chat.js';
import Contact from '../src/models/Contact.js';

dotenv.config({ path: './server/.env' });

async function runAudit() {
  const dbUri = process.env.MONGODB_URI;
  if (!dbUri) {
    console.error('Error: MONGODB_URI is not defined in .env file.');
    process.exit(1);
  }

  try {
    await mongoose.connect(dbUri);
    console.log('Successfully connected to the database.');

    const owners = await User.find({ role: 'owner' });

    if (owners.length === 0) {
      console.log('No users with role "owner" found.');
      return;
    }

    console.log(`\nFound ${owners.length} owner(s). Starting audit...\n`);
    console.log('----------------------------------------');

    for (const owner of owners) {
      console.log(`\nOwner: ${owner.name} (${owner.email})`);
      console.log(`Workspace ID: ${owner.workspaceId}`);
      
      const workspaceId = owner.workspaceId;

      const agentCount = await Agent.countDocuments({ workspaceId });
      const platformCount = await Platform.countDocuments({ workspaceId });
      const chatCount = await Chat.countDocuments({ workspaceId });
      const contactCount = await Contact.countDocuments({ workspaceId });

      console.log('  - AI Agents: ', agentCount);
      console.log('  - Connected Platforms: ', platformCount);
      console.log('  - Chats: ', chatCount);
      console.log('  - Contacts: ', contactCount);
    }

    console.log('\n----------------------------------------');
    console.log('Audit complete.');

  } catch (error) {
    console.error('\nAn error occurred during the audit:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from the database.');
  }
}

runAudit();
