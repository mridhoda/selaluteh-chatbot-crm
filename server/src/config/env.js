import 'dotenv/config';

const CRITICAL = 'critical';
const OPTIONAL = 'optional';

function redact(value) {
  if (!value || value.length < 8) return value;
  return value.slice(0, 4) + '...' + value.slice(-4);
}

function validate(config) {
  const errors = [];
  for (const [key, { value, severity, label }] of Object.entries(config)) {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      if (severity === CRITICAL) {
        errors.push(`Missing critical config: ${label || key}`);
      }
    }
  }
  if (errors.length > 0) {
    console.error('Environment validation failed:');
    for (const err of errors) console.error(`  - ${err}`);
    process.exit(1);
  }
}

const raw = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  dataSource: process.env.DATA_SOURCE || 'supabase',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/chatbot_crm',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'devsecret',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  metaVerifyToken: process.env.META_VERIFY_TOKEN || '',
  metaAppSecret: process.env.META_APP_SECRET || '',
  metaAccessToken: process.env.META_ACCESS_TOKEN || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  paymentProvider: process.env.PAYMENT_PROVIDER || 'manual',
  midtransServerKey: process.env.MIDTRANS_SERVER_KEY || '',
  midtransClientKey: process.env.MIDTRANS_CLIENT_KEY || '',
  xenditSecretKey: process.env.XENDIT_SECRET_KEY || '',
  paymentWebhookSecret: process.env.PAYMENT_WEBHOOK_SECRET || '',
  smtpUrl: process.env.SMTP_URL || '',
  smtpFrom: process.env.SMTP_FROM || 'no-reply@chatbot.local',
  localUploadRoot: process.env.LOCAL_UPLOAD_ROOT || 'server/uploads',
  publicFilesBaseUrl: process.env.PUBLIC_FILES_BASE_URL || '',
  corsOriginList: process.env.CORS_ORIGIN || '*',
};

validate({
  jwtSecret: { value: raw.jwtSecret, severity: CRITICAL, label: 'JWT_SECRET' },
  port: { value: raw.port, severity: CRITICAL, label: 'PORT' },
});

if (!['supabase', 'mongo'].includes(raw.dataSource)) {
  console.error('DATA_SOURCE must be either "supabase" or "mongo".');
  process.exit(1);
}

if (raw.dataSource === 'supabase') {
  validate({
    supabaseUrl: { value: raw.supabaseUrl, severity: CRITICAL, label: 'SUPABASE_URL' },
    supabaseServiceRoleKey: { value: raw.supabaseServiceRoleKey, severity: CRITICAL, label: 'SUPABASE_SERVICE_ROLE_KEY' },
  });
}

if (raw.dataSource === 'mongo') {
  validate({
    mongoUri: { value: raw.mongoUri, severity: CRITICAL, label: 'MONGODB_URI' },
  });
}

const nodeEnv = raw.nodeEnv;
const isProduction = nodeEnv === 'production';

if (isProduction) {
  validate({
    telegramBotToken: { value: raw.telegramBotToken, severity: CRITICAL, label: 'TELEGRAM_BOT_TOKEN' },
    paymentWebhookSecret: { value: raw.paymentWebhookSecret, severity: CRITICAL, label: 'PAYMENT_WEBHOOK_SECRET' },
  });

  if (raw.paymentProvider !== 'manual') {
    validate({
      midtransServerKey: { value: raw.midtransServerKey, severity: CRITICAL, label: 'MIDTRANS_SERVER_KEY' },
    });
  }
}

if (raw.publicBaseUrl && raw.publicBaseUrl === '/') {
  console.error('PUBLIC_BASE_URL must not be "/". Set it to your tunnel URL.');
  process.exit(1);
}

export const env = {
  nodeEnv: raw.nodeEnv,
  dataSource: raw.dataSource,
  isProduction: nodeEnv === 'production',
  port: parseInt(raw.port, 10) || 5000,
  mongoUri: raw.mongoUri,
  supabaseUrl: raw.supabaseUrl,
  supabaseServiceRoleKey: raw.supabaseServiceRoleKey,
  supabaseAnonKey: raw.supabaseAnonKey,
  corsOrigin: raw.corsOrigin,
  corsOriginList: raw.corsOriginList,
  publicBaseUrl: raw.publicBaseUrl,
  jwtSecret: raw.jwtSecret,
  telegramBotToken: raw.telegramBotToken,
  metaVerifyToken: raw.metaVerifyToken,
  metaAppSecret: raw.metaAppSecret,
  metaAccessToken: raw.metaAccessToken,
  openaiApiKey: raw.openaiApiKey,
  googleApiKey: raw.googleApiKey,
  paymentProvider: raw.paymentProvider,
  midtransServerKey: raw.midtransServerKey,
  midtransClientKey: raw.midtransClientKey,
  xenditSecretKey: raw.xenditSecretKey,
  paymentWebhookSecret: raw.paymentWebhookSecret,
  smtpUrl: raw.smtpUrl,
  smtpFrom: raw.smtpFrom,
  localUploadRoot: raw.localUploadRoot,
  publicFilesBaseUrl: raw.publicFilesBaseUrl,
};

export function getAllowedCorsOrigins() {
  if (env.corsOrigin === '*') return '*';
  return env.corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function redactedConfig() {
  return {
    nodeEnv: env.nodeEnv,
    dataSource: env.dataSource,
    port: env.port,
    mongoUri: redact(env.mongoUri),
    supabaseUrl: env.supabaseUrl,
    supabaseServiceRoleKey: env.supabaseServiceRoleKey ? 'configured' : '',
    supabaseAnonKey: env.supabaseAnonKey ? 'configured' : '',
    corsOrigin: env.corsOrigin,
    publicBaseUrl: env.publicBaseUrl,
    jwtSecret: redact(env.jwtSecret),
    telegramBotToken: env.telegramBotToken ? 'configured' : '',
    metaVerifyToken: env.metaVerifyToken ? 'configured' : '',
    metaAppSecret: env.metaAppSecret ? 'configured' : '',
    metaAccessToken: env.metaAccessToken ? 'configured' : '',
    openaiApiKey: env.openaiApiKey ? 'configured' : '',
    googleApiKey: env.googleApiKey ? 'configured' : '',
    paymentProvider: env.paymentProvider,
    midtransServerKey: env.midtransServerKey ? 'configured' : '',
    midtransClientKey: env.midtransClientKey ? 'configured' : '',
    xenditSecretKey: env.xenditSecretKey ? 'configured' : '',
    paymentWebhookSecret: env.paymentWebhookSecret ? 'configured' : '',
    smtpUrl: env.smtpUrl ? 'configured' : '',
    smtpFrom: env.smtpFrom,
    localUploadRoot: env.localUploadRoot,
    publicFilesBaseUrl: env.publicFilesBaseUrl,
  };
}
