import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import platformRoutes from './routes/platforms.js';
import agentRoutes from './routes/agents.js';
import chatRoutes from './routes/chats.js';
import webhookRoutes from './routes/webhooks/index.js';
import analyticsRoutes from './routes/analytics.js';
import billingRoutes from './routes/billing.js';
import profileRoutes from './routes/profile.js';
import contactRoutes from './routes/contacts.js';
import integrationsRoutes from './routes/integrations.js';
import complaintRoutes from './routes/complaints.js';
import orderRoutes from './routes/orders.js';
import './services/followups.js';


const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot_crm';
const rawCorsOrigin = process.env.CORS_ORIGIN || '*';
const allowedOrigins = rawCorsOrigin === '*'
  ? '*'
  : rawCorsOrigin.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins === '*' ? true : allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use('/files', express.static('uploads'));

import { start as startFollowups } from './services/followups.js';

mongoose.connect(MONGODB_URI).then(() => {
  console.log('MongoDB connected');
  startFollowups();

  app.get('/', (req, res) => {
    res.json({ ok: true, name: 'Chatbot CRM API', version: '1.0.0' });
  });

  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/platforms', platformRoutes);
  app.use('/agents', agentRoutes);
  app.use('/chats', chatRoutes);
  app.use('/webhook', webhookRoutes); // webhooks path roots
  app.use('/analytics', analyticsRoutes);
  app.use('/billing', billingRoutes);
  app.use('/profile', profileRoutes);
  app.use('/contacts', contactRoutes);
  app.use('/integrations', integrationsRoutes);
  app.use('/complaints', complaintRoutes);
  app.use('/orders', orderRoutes);

  // global error handler
  app.use((err, req, res, next) => {
    console.error('[ERROR]', err);
    res.status(err.status || 500).json({ error: err.message || 'Server error' });
  });

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
    if (process.env.PUBLIC_BASE_URL) {
      console.log('Public base URL:', process.env.PUBLIC_BASE_URL);
    } else {
      console.log('Tip: set PUBLIC_BASE_URL to your Cloudflare Tunnel URL for webhooks.');
    }
  });
}).catch((err) => {
  console.error('Mongo connect error:', err.message);
  process.exit(1);
});
