import 'dotenv/config';
import mongoose from 'mongoose';
import Platform from '../src/models/Platform.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot_crm';

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('Connected to DB');
    const platforms = await Platform.find({ type: 'telegram' }).sort({ createdAt: -1 });

    const seenTokens = new Set();
    const toDelete = [];

    for (const p of platforms) {
        if (seenTokens.has(p.token)) {
            toDelete.push(p._id);
        } else {
            seenTokens.add(p.token);
        }
    }

    if (toDelete.length > 0) {
        console.log(`Found ${toDelete.length} duplicate platforms to delete:`, toDelete);
        const res = await Platform.deleteMany({ _id: { $in: toDelete } });
        console.log(`Deleted ${res.deletedCount} platforms.`);
    } else {
        console.log('No duplicates found.');
    }

    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
