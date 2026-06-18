/**
 * supabase-seed.js
 *
 * Seeds fresh development/test data into Supabase/Postgres.
 * Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from environment.
 *
 * SECURITY:
 * - Uses fake/placeholder provider credentials — never real secrets.
 * - Do not import Mongo data.
 * - Do not build Mongo backfill or reconciliation.
 * - SUPABASE_SERVICE_ROLE_KEY must be set in server/.env, not in code.
 *
 * USAGE:
 *   node scripts/seed/supabase-seed.js
 *   node scripts/seed/supabase-seed.js --dry-run   (show plan only)
 *
 * REQUIREMENTS:
 *   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.
 *   SQL migrations 001-009 must be applied to the target Supabase project first.
 *
 * IDEMPOTENT: Safe to run multiple times — uses upsert by email/name.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { randomUUID } from 'node:crypto';
import { encrypt } from '../../src/utils/encryption.js';

const isDryRun = process.argv.includes('--dry-run');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server/.env');
  process.exit(1);
}

const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------------------------------------------------------------------------
// Seed data definitions (all fake credentials — no real secrets)
// ---------------------------------------------------------------------------

const SEED_WORKSPACE = {
  name: 'SelaluTeh Demo',
  status: 'active',
  metadata: {},
};

const SEED_USERS = [
  {
    name: 'Owner Demo',
    email: 'owner@selaluteh.demo',
    // bcrypt hash of 'demo12345' — never a real password, safe for dev/test
    passwordHash: '$2a$10$you2LqdoSw4H.z3u8X5L1uCKN/ul1/wjCtIYbqWSqfjCpy8xnaBDG',
    role: 'owner',
    verified: true,
    status: 'offline',
    plan: 'pro',
  },
  {
    name: 'Admin Demo',
    email: 'admin@selaluteh.demo',
    passwordHash: '$2a$10$you2LqdoSw4H.z3u8X5L1uCKN/ul1/wjCtIYbqWSqfjCpy8xnaBDG',
    role: 'super',
    verified: true,
    status: 'offline',
    plan: 'pro',
  },
  {
    name: 'Agent Demo',
    email: 'agent@selaluteh.demo',
    passwordHash: '$2a$10$you2LqdoSw4H.z3u8X5L1uCKN/ul1/wjCtIYbqWSqfjCpy8xnaBDG',
    role: 'agent',
    verified: true,
    status: 'offline',
    plan: 'pro',
  },
];

const SEED_OUTLETS = [
  { name: 'Outlet Makassar Pusat', code: 'MKS-01', city: 'Makassar', timezone: 'Asia/Makassar', status: 'active' },
  { name: 'Outlet Makassar Utara', code: 'MKS-02', city: 'Makassar', timezone: 'Asia/Makassar', status: 'active' },
];

const SEED_PLATFORM = {
  // Fake Telegram platform — safe placeholder token
  type: 'telegram',
  label: 'Demo Telegram Bot',
  token: 'PLACEHOLDER_BOT_TOKEN_NOT_REAL',
  status: 'pending_setup',
  health: 'not_configured',
  metadata: {},
};

const SEED_PRODUCTS = [
  {
    name: 'Teh Tarik Original',
    description: 'Teh tarik klasik, creamy dan manis.',
    category: 'Minuman',
    slug: 'teh-tarik-original',
    basePrice: 15000,
    isActive: true,
    metadata: {},
  },
  {
    name: 'Teh Tarik Less Sugar',
    description: 'Teh tarik kurang gula untuk yang menjaga pola makan.',
    category: 'Minuman',
    slug: 'teh-tarik-less-sugar',
    basePrice: 15000,
    isActive: true,
    metadata: {},
  },
  {
    name: 'Teh Tarik Vanilla',
    description: 'Teh tarik dengan tambahan rasa vanilla.',
    category: 'Minuman',
    slug: 'teh-tarik-vanilla',
    basePrice: 18000,
    isActive: true,
    metadata: {},
  },
];

// ---------------------------------------------------------------------------
// Seed execution
// ---------------------------------------------------------------------------

async function log(msg) {
  const prefix = isDryRun ? '[DRY-RUN]' : '[SEED]';
  console.log(`${prefix} ${msg}`);
}

async function upsertWorkspace() {
  await log('Upserting workspace...');
  if (isDryRun) return { id: 'dry-run-workspace-id' };

  // Check if workspace exists by name
  const { data: existing } = await client
    .from('workspaces')
    .select('id')
    .eq('name', SEED_WORKSPACE.name)
    .maybeSingle();

  if (existing) {
    await log(`Workspace already exists: ${existing.id}`);
    return existing;
  }

  const { data, error } = await client
    .from('workspaces')
    .insert(SEED_WORKSPACE)
    .select()
    .single();

  if (error) throw new Error(`upsertWorkspace failed: ${error.message}`);
  await log(`Created workspace: ${data.id}`);
  return data;
}

async function upsertUsers(workspaceId) {
  const userIds = {};
  for (const u of SEED_USERS) {
    await log(`Upserting user: ${u.email}`);
    if (isDryRun) {
      userIds[u.email] = `dry-run-user-${u.role}`;
      continue;
    }

    const { data: existing } = await client
      .from('users')
      .select('id')
      .eq('email', u.email)
      .maybeSingle();

    if (existing) {
      await log(`  Already exists: ${existing.id}`);
      userIds[u.email] = existing.id;
      continue;
    }

    const planExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await client
      .from('users')
      .insert({
        workspace_id: workspaceId,
        name: u.name,
        email: u.email,
        password_hash: u.passwordHash,
        role: u.role,
        verified: u.verified,
        status: u.status,
        plan: u.plan,
        plan_expiry: planExpiry,
        metadata: {},
      })
      .select()
      .single();

    if (error) throw new Error(`upsertUser(${u.email}) failed: ${error.message}`);
    await log(`  Created user: ${data.id}`);
    userIds[u.email] = data.id;
  }
  return userIds;
}

async function upsertOutlets(workspaceId) {
  const outletIds = [];
  for (const o of SEED_OUTLETS) {
    await log(`Upserting outlet: ${o.code}`);
    if (isDryRun) {
      outletIds.push(`dry-run-outlet-${o.code}`);
      continue;
    }

    const { data: existing } = await client
      .from('outlets')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('code', o.code)
      .maybeSingle();

    if (existing) {
      await log(`  Already exists: ${existing.id}`);
      outletIds.push(existing.id);
      continue;
    }

    const { data, error } = await client
      .from('outlets')
      .insert({ workspace_id: workspaceId, ...o })
      .select()
      .single();

    if (error) throw new Error(`upsertOutlet(${o.code}) failed: ${error.message}`);
    await log(`  Created outlet: ${data.id}`);
    outletIds.push(data.id);
  }
  return outletIds;
}

async function upsertMemberships(workspaceId, userIds) {
  for (const [email, userId] of Object.entries(userIds)) {
    const user = SEED_USERS.find((u) => u.email === email);
    const memberRole = user.role === 'owner' ? 'owner' : user.role === 'super' ? 'admin' : 'human_agent';
    await log(`Upserting membership: ${email} → ${memberRole}`);
    if (isDryRun) continue;

    const { error } = await client
      .from('user_workspace_memberships')
      .upsert(
        { workspace_id: workspaceId, user_id: userId, role: memberRole, status: 'active' },
        { onConflict: 'workspace_id,user_id' },
      );

    if (error) throw new Error(`upsertMembership(${email}) failed: ${error.message}`);
  }
}

async function upsertWorkspaceSettings(workspaceId) {
  await log('Upserting workspace settings...');
  if (isDryRun) return;

  const { error } = await client
    .from('workspace_settings')
    .upsert(
      {
        workspace_id: workspaceId,
        business_display_name: 'SelaluTeh',
        timezone: 'Asia/Makassar',
        currency: 'IDR',
        locale: 'id-ID',
        allow_all_outlets_view: false,
        primary_ai: 'gemini',
        secondary_ai: 'openai',
        default_language: 'id',
        ai_commerce_enabled: true,
        require_checkout_confirmation: true,
        human_handoff_enabled: true,
        // metadata: payment sandbox settings (placeholder only — no real keys)
        metadata: {
          payment_provider: 'midtrans',
          payment_env: 'sandbox',
          midtrans_server_key: 'PLACEHOLDER_MIDTRANS_SANDBOX_KEY',
          midtrans_client_key: 'PLACEHOLDER_MIDTRANS_CLIENT_KEY',
        },
      },
      { onConflict: 'workspace_id' },
    );

  if (error) throw new Error(`upsertWorkspaceSettings failed: ${error.message}`);
  await log('Workspace settings upserted.');
}

async function upsertPlatform(workspaceId, userId) {
  await log('Upserting Telegram platform...');
  if (isDryRun) return;

  const { data: existing } = await client
    .from('platforms')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('type', 'telegram')
    .maybeSingle();

  if (existing) {
    await log(`  Platform already exists: ${existing.id}`);
    return;
  }

  const { data, error } = await client
    .from('platforms')
    .insert({
      workspace_id: workspaceId,
      type: SEED_PLATFORM.type,
      label: SEED_PLATFORM.label,
      token_encrypted: encrypt(SEED_PLATFORM.token),
      status: SEED_PLATFORM.status,
      health: SEED_PLATFORM.health,
      metadata: SEED_PLATFORM.metadata,
    })
    .select()
    .single();

  if (error) throw new Error(`upsertPlatform failed: ${error.message}`);
  await log(`  Created platform: ${data.id}`);
}

async function upsertProducts(workspaceId, outletIds) {
  const productIds = [];
  for (const p of SEED_PRODUCTS) {
    await log(`Upserting product: ${p.slug}`);
    if (isDryRun) continue;

    const { data: existing } = await client
      .from('products')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('slug', p.slug)
      .maybeSingle();

    let productId = existing?.id;
    if (!existing) {
      const { data, error } = await client
        .from('products')
        .insert({
          workspace_id: workspaceId,
          name: p.name,
          description: p.description,
          slug: p.slug,
          base_price: p.basePrice,
          is_active: p.isActive,
          metadata: { ...p.metadata, category: p.category },
        })
        .select()
        .single();

      if (error) throw new Error(`upsertProduct(${p.slug}) failed: ${error.message}`);
      await log(`  Created product: ${data.id}`);
      productId = data.id;
    } else {
      await log(`  Already exists: ${existing.id}`);
    }
    if (productId) productIds.push(productId);
  }

  // Seed availability
  if (outletIds && outletIds.length > 0) {
    for (const productId of productIds) {
      for (const outletId of outletIds) {
        await log(`Seeding availability for product ${productId} at outlet ${outletId}`);
        if (isDryRun) continue;
        const { data: existingAvail, error: selectError } = await client
          .from('product_outlet_availability')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('product_id', productId)
          .eq('outlet_id', outletId)
          .maybeSingle();

        if (selectError) throw new Error(`check availability failed: ${selectError.message}`);

        if (!existingAvail) {
          const { error } = await client
            .from('product_outlet_availability')
            .insert({
              workspace_id: workspaceId,
              product_id: productId,
              variant_id: null,
              outlet_id: outletId,
              is_available: true,
              status: 'active'
            });
          if (error) throw new Error(`insert availability failed: ${error.message}`);
        } else {
          await log('  Availability already exists.');
        }
      }
    }
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('SelaluTeh — Supabase Seed Script');
  if (isDryRun) console.log('DRY RUN MODE — no changes will be made');
  console.log('='.repeat(60));

  try {
    const workspace = await upsertWorkspace();
    const userIds = await upsertUsers(workspace.id);
    const outletIds = await upsertOutlets(workspace.id);
    await upsertMemberships(workspace.id, userIds);
    await upsertWorkspaceSettings(workspace.id);

    const ownerEmail = 'owner@selaluteh.demo';
    await upsertPlatform(workspace.id, userIds[ownerEmail]);
    await upsertProducts(workspace.id, outletIds);

    console.log('='.repeat(60));
    console.log('Seed complete!');
    console.log('Login credentials (demo only — placeholder passwords):');
    console.log('  Email: owner@selaluteh.demo | admin@selaluteh.demo | agent@selaluteh.demo');
    console.log('  Password hash for: demo12345 (change before any real use)');
    console.log('='.repeat(60));
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

main();
