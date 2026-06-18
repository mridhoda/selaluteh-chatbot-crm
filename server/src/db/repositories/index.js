/**
 * repositories/index.js
 *
 * Central registry for all Supabase-backed repositories.
 * All Mongoose/legacy repositories have been removed (task 24.19 cleanup).
 *
 * Data source: Supabase/Postgres (full cutover complete)
 */

// ─── 24.7 — Auth / Users / Workspaces / Memberships ──────────────────────────
export { usersSupabaseRepository } from './users.repository.js';
export { usersSupabaseRepository as usersRepository } from './users.repository.js';
export { workspacesSupabaseRepository } from './workspaces.repository.js';
export { workspacesSupabaseRepository as workspacesRepository } from './workspaces.repository.js';
export { membershipsSupabaseRepository } from './memberships.repository.js';
export { membershipsSupabaseRepository as workspaceMembershipsRepository } from './memberships.repository.js';
export { membershipsSupabaseRepository as membershipsRepository } from './memberships.repository.js';
export { authSupabaseRepository } from './auth.repository.js';

// ─── 24.8 — Outlets + UserOutletAccess ───────────────────────────────────────
export { outletsSupabaseRepository } from './outlets.supabase.repository.js';
export { outletsSupabaseRepository as outletsRepository } from './outlets.supabase.repository.js';

// ─── 24.9 — Platforms ────────────────────────────────────────────────────────
export { platformsSupabaseRepository } from './platforms.supabase.repository.js';
export { platformsSupabaseRepository as platformsRepository } from './platforms.supabase.repository.js';

// ─── 24.10 — Contacts / Chats / Messages ─────────────────────────────────────
export { contactsSupabaseRepository } from './contacts.supabase.repository.js';
export { contactsSupabaseRepository as contactsRepository } from './contacts.supabase.repository.js';
export { chatsSupabaseRepository } from './chats.supabase.repository.js';
export { chatsSupabaseRepository as chatsRepository } from './chats.supabase.repository.js';
export { messagesSupabaseRepository } from './messages.supabase.repository.js';
export { messagesSupabaseRepository as messagesRepository } from './messages.supabase.repository.js';

// ─── 24.11 — Products + ProductOutletAvailability ────────────────────────────
export { productsSupabaseRepository } from './products.supabase.repository.js';
export { productsSupabaseRepository as productsRepository } from './products.supabase.repository.js';

// ─── 24.12 — Carts + CartItems ───────────────────────────────────────────────
export { cartsSupabaseRepository } from './carts.supabase.repository.js';
export { cartsSupabaseRepository as cartsRepository } from './carts.supabase.repository.js';

// ─── 24.13 — Checkouts + CheckoutItems ───────────────────────────────────────
export { checkoutsSupabaseRepository } from './checkouts.supabase.repository.js';
export { checkoutsSupabaseRepository as checkoutsRepository } from './checkouts.supabase.repository.js';

// ─── 24.14 — Orders + OrderItems + OrderEvents ───────────────────────────────
export { ordersSupabaseRepository } from './orders.supabase.repository.js';
export { ordersSupabaseRepository as ordersRepository } from './orders.supabase.repository.js';

// ─── 24.15 — Payments + PaymentEvents ────────────────────────────────────────
export { paymentsSupabaseRepository } from './payments.supabase.repository.js';
export { paymentsSupabaseRepository as paymentsRepository } from './payments.supabase.repository.js';
export { paymentsSupabaseRepository as paymentEventsRepository } from './payments.supabase.repository.js';

// ─── 24.16 — Webhook Events ──────────────────────────────────────────────────
export { webhookEventsSupabaseRepository } from './webhook-events.supabase.repository.js';
export { webhookEventsSupabaseRepository as webhookEventsRepository } from './webhook-events.supabase.repository.js';

// ─── 24.17 — AI Actions ──────────────────────────────────────────────────────
export { aiActionsSupabaseRepository } from './ai-actions.supabase.repository.js';
export { aiActionsSupabaseRepository as aiActionsRepository } from './ai-actions.supabase.repository.js';

// ─── Agents + Knowledge (JSONB embedded in agents table) ─────────────────────
export { agentsSupabaseRepository } from './agents.supabase.repository.js';
export { agentsSupabaseRepository as agentsRepository } from './agents.supabase.repository.js';

// ─── Complaints ───────────────────────────────────────────────────────────────
export { complaintsSupabaseRepository } from './complaints.supabase.repository.js';
export { complaintsSupabaseRepository as complaintsRepository } from './complaints.supabase.repository.js';
