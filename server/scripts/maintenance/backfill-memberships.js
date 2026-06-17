/**
 * Backfill existing users into UserWorkspaceMembership.
 *
 * Usage:
 *   node scripts/maintenance/backfill-memberships.js [--dry-run]
 *
 * Maps each User with a workspaceId + role into a UserWorkspaceMembership record.
 * Skips users that already have an active membership.
 * Does NOT assign elevated roles (owner/super) without explicit mapping.
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

const DRY_RUN = process.argv.includes('--dry-run');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));
  const Membership = mongoose.model('UserWorkspaceMembership', new mongoose.Schema({}, { strict: false, collection: 'userworkspacememberships' }));

  const users = await User.find({ workspaceId: { $ne: null } }).lean();
  console.log(`Found ${users.length} users with workspaceId.`);

  let created = 0;
  let skipped = 0;
  let ambiguous = [];

  for (const user of users) {
    if (!user.workspaceId) continue;

    const existing = await Membership.findOne({
      userId: user._id,
      workspaceId: user.workspaceId,
      status: 'active',
    });
    if (existing) {
      skipped++;
      continue;
    }

    let role = 'human_agent';
    if (user.role === 'owner' || user.role === 'super') {
      role = 'owner';
    } else if (user.role === 'admin') {
      role = 'admin';
    } else {
      ambiguous.push({ userId: user._id, email: user.email, role: user.role });
    }

    if (DRY_RUN) {
      console.log(`  [DRY] Would create: user=${user._id} workspace=${user.workspaceId} role=${role}`);
      created++;
    } else {
      await Membership.create({
        userId: user._id,
        workspaceId: user.workspaceId,
        role,
        status: 'active',
        joinedAt: user.createdAt || new Date(),
      });
      created++;
    }
  }

  console.log(`\nCreated: ${created}, Skipped (already exists): ${skipped}`);
  if (ambiguous.length > 0) {
    console.log(`\nAmbiguous roles (assigned human_agent): ${ambiguous.length}`);
    for (const a of ambiguous.slice(0, 10)) {
      console.log(`  user=${a.userId} role=${a.role}`);
    }
    if (ambiguous.length > 10) console.log(`  ... and ${ambiguous.length - 10} more`);
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Backfill failed:', err.message);
  process.exit(1);
});
