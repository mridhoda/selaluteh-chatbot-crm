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
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseDatabaseUrl: process.env.SUPABASE_DATABASE_URL || '',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'devsecret',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  metaVerifyToken: process.env.META_VERIFY_TOKEN || '',
  metaAppSecret: process.env.META_APP_SECRET || '',
  metaAccessToken: process.env.META_ACCESS_TOKEN || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiBaseUrl: process.env.OPENAI_BASE_URL || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  openaiAppName: process.env.OPENAI_APP_NAME || 'SelaluTeh Chatbot CRM',
  openaiReferer: process.env.OPENAI_REFERER || '',
  googleApiKey: process.env.GOOGLE_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
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

const isTest = raw.nodeEnv === 'test';

validate({
  jwtSecret: { value: raw.jwtSecret, severity: CRITICAL, label: 'JWT_SECRET' },
  port: { value: raw.port, severity: CRITICAL, label: 'PORT' },
  // In test mode, Supabase creds are optional — tests that need Supabase check via isTestDbConfigured()
  supabaseUrl: { value: raw.supabaseUrl, severity: isTest ? OPTIONAL : CRITICAL, label: 'SUPABASE_URL' },
  supabaseServiceRoleKey: { value: raw.supabaseServiceRoleKey, severity: isTest ? OPTIONAL : CRITICAL, label: 'SUPABASE_SERVICE_ROLE_KEY' },
  supabaseDatabaseUrl: { value: raw.supabaseDatabaseUrl, severity: isTest ? OPTIONAL : CRITICAL, label: 'SUPABASE_DATABASE_URL' },
});

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
  isProduction: raw.nodeEnv === 'production',
  port: parseInt(raw.port, 10) || 5000,
  supabaseUrl: raw.supabaseUrl,
  supabaseServiceRoleKey: raw.supabaseServiceRoleKey,
  supabaseAnonKey: raw.supabaseAnonKey,
  // BACKEND-ONLY: never expose supabaseDatabaseUrl to frontend, logs, or docs
  supabaseDatabaseUrl: raw.supabaseDatabaseUrl,
  corsOrigin: raw.corsOrigin,
  corsOriginList: raw.corsOriginList,
  publicBaseUrl: raw.publicBaseUrl,
  jwtSecret: raw.jwtSecret,
  telegramBotToken: raw.telegramBotToken,
  metaVerifyToken: raw.metaVerifyToken,
  metaAppSecret: raw.metaAppSecret,
  metaAccessToken: raw.metaAccessToken,
  openaiApiKey: raw.openaiApiKey,
  openaiBaseUrl: raw.openaiBaseUrl,
  openaiModel: raw.openaiModel,
  openaiAppName: raw.openaiAppName,
  openaiReferer: raw.openaiReferer,
  googleApiKey: raw.googleApiKey,
  geminiModel: raw.geminiModel,
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
    port: env.port,
    supabaseUrl: env.supabaseUrl,
    supabaseServiceRoleKey: env.supabaseServiceRoleKey ? 'configured' : '',
    supabaseAnonKey: env.supabaseAnonKey ? 'configured' : '',
    // BACKEND-ONLY: always masked in output
    supabaseDatabaseUrl: env.supabaseDatabaseUrl ? 'configured' : '',
    corsOrigin: env.corsOrigin,
    publicBaseUrl: env.publicBaseUrl,
    jwtSecret: redact(env.jwtSecret),
    telegramBotToken: env.telegramBotToken ? 'configured' : '',
    metaVerifyToken: env.metaVerifyToken ? 'configured' : '',
    metaAppSecret: env.metaAppSecret ? 'configured' : '',
    metaAccessToken: env.metaAccessToken ? 'configured' : '',
    openaiApiKey: env.openaiApiKey ? 'configured' : '',
    openaiBaseUrl: env.openaiBaseUrl,
    openaiModel: env.openaiModel,
    openaiAppName: env.openaiAppName,
    openaiReferer: env.openaiReferer,
    googleApiKey: env.googleApiKey ? 'configured' : '',
    geminiModel: env.geminiModel,
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
