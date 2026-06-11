import 'dotenv/config';
import mongoose from 'mongoose';
import Platform from '../src/models/Platform.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot_crm';

mongoose.connect(MONGODB_URI).then(async () => {
  console.log('Connected to DB');
  const platforms = await Platform.find({ type: 'telegram' });
  console.log(`Found ${platforms.length} Telegram platforms:`);
  platforms.forEach(p => {
    const tokenDisplay = p.token ? `${p.token.slice(0, 5)}...${p.token.slice(-5)}` : 'NONE';
    console.log(`- ID: ${p._id}`);
    console.log(`  Token: ${tokenDisplay}`);
    console.log(`  Created: ${p.createdAt}`);
    console.log(`  Name/Label: ${p.name || 'N/A'}`);
    console.log('---');
  });
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
