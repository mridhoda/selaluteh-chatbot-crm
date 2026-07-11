import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { contactsRepository, ordersRepository } from '../db/repositories/index.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { transformOrderToPublic } from './public-order.service.js';

function toCustomer(contact) {
  return { id: contact.id, name: contact.name || '', phone: contact.phone || '', email: contact.email || '' };
}

function signCustomerSession({ contact, workspaceId }) {
  return jwt.sign({ type: 'public_customer', contactId: contact.id, workspaceId }, env.jwtSecret, { expiresIn: '30d' });
}

export async function registerPublicCustomer({ workspaceId, storefrontSlug, name, phone, email, password }) {
  if (!name || !phone || !email || String(password || '').length < 6) throw new AppError('CUSTOMER_VALIDATION', 'Nama, nomor WhatsApp, email, dan password minimal 6 karakter wajib diisi.', 400);
  const [existingEmail, existingPhone] = await Promise.all([
    contactsRepository.findPublicStoreCustomerByEmail({ workspaceId, email }),
    contactsRepository.findPublicStoreCustomerByPhone({ workspaceId, phone }),
  ]);
  if (existingEmail?.metadata?.customer_password_hash) throw new AppError('CUSTOMER_EMAIL_EXISTS', 'Email sudah terdaftar. Silakan masuk.', 409);
  if (existingPhone?.metadata?.customer_password_hash) throw new AppError('CUSTOMER_PHONE_EXISTS', 'Nomor WhatsApp sudah terdaftar. Silakan masuk.', 409);
  if (existingEmail && existingPhone && existingEmail.id !== existingPhone.id) {
    throw new AppError('CUSTOMER_GUEST_CONFLICT', 'Email dan nomor terhubung ke data guest yang berbeda. Hubungi outlet untuk bantuan.', 409);
  }
  const guest = existingPhone || existingEmail;
  const contact = await contactsRepository.upsertPublicStoreCustomer({
    workspaceId, storefrontSlug, contactId: guest?.id, name: String(name).trim(), phone: String(phone).trim(), email: String(email).trim().toLowerCase(), passwordHash: await bcrypt.hash(password, 10), upgradedFromGuest: Boolean(guest),
  });
  return { customer: toCustomer(contact), customerId: contact.id, token: signCustomerSession({ contact, workspaceId }), upgradedFromGuest: Boolean(guest) };
}

export async function loginPublicCustomer({ workspaceId, email, password }) {
  const contact = await contactsRepository.findPublicStoreCustomerByEmail({ workspaceId, email });
  if (!contact?.metadata?.customer_password_hash || !(await bcrypt.compare(String(password || ''), contact.metadata.customer_password_hash))) {
    throw new AppError('CUSTOMER_INVALID_CREDENTIALS', 'Email atau password tidak sesuai.', 401);
  }
  return { customer: toCustomer(contact), customerId: contact.id, token: signCustomerSession({ contact, workspaceId }) };
}

export function requirePublicCustomer(req, res, next) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    if (payload.type !== 'public_customer' || !payload.contactId || !payload.workspaceId) throw new Error('Invalid customer session');
    req.publicCustomer = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Sesi customer tidak valid. Silakan masuk kembali.' });
  }
}

export async function getPublicCustomerSession({ workspaceId, contactId }) {
  const contact = await contactsRepository.findById({ workspaceId, contactId });
  if (!contact) throw new AppError('CUSTOMER_NOT_FOUND', 'Customer tidak ditemukan.', 404);
  return { customer: toCustomer(contact) };
}

export async function listPublicCustomerOrders({ contactId }) {
  const orders = await ordersRepository.findByContactIdGlobal({ contactId });
  return orders.map((order) => transformOrderToPublic(order));
}
