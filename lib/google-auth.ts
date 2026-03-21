import { google } from 'googleapis';
import { sql } from '@vercel/postgres';

const getClientId = () => process.env.GOOGLE_CLIENT_ID?.trim() || '';
const getClientSecret = () => process.env.GOOGLE_CLIENT_SECRET?.trim() || '';
const getRedirectUri = () => process.env.GOOGLE_REDIRECT_URI?.trim() || 'https://console.palette-lab.com/api/google/callback';

export const createOAuth2Client = () => {
  return new google.auth.OAuth2(getClientId(), getClientSecret(), getRedirectUri());
};

export const getAuthUrl = () => {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/webmasters.readonly',
    ],
  });
};

export const exchangeCode = async (code: string) => {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  return tokens;
};

// Store/retrieve admin's Google tokens
let tokensTableReady = false;

const ensureTokensTable = async () => {
  if (tokensTableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS console_google_tokens (
      id INTEGER PRIMARY KEY DEFAULT 1,
      access_token TEXT,
      refresh_token TEXT,
      expiry_date BIGINT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  tokensTableReady = true;
};

export const saveGoogleTokens = async (tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null }) => {
  await ensureTokensTable();
  const existing = await sql`SELECT id FROM console_google_tokens WHERE id = 1`;
  if (existing.rows.length > 0) {
    if (tokens.refresh_token) {
      await sql`UPDATE console_google_tokens SET access_token = ${tokens.access_token || null}, refresh_token = ${tokens.refresh_token}, expiry_date = ${tokens.expiry_date || null}, updated_at = NOW() WHERE id = 1`;
    } else {
      await sql`UPDATE console_google_tokens SET access_token = ${tokens.access_token || null}, expiry_date = ${tokens.expiry_date || null}, updated_at = NOW() WHERE id = 1`;
    }
  } else {
    await sql`INSERT INTO console_google_tokens (id, access_token, refresh_token, expiry_date) VALUES (1, ${tokens.access_token || null}, ${tokens.refresh_token || null}, ${tokens.expiry_date || null})`;
  }
};

export const getGoogleTokens = async (): Promise<{ access_token: string; refresh_token: string; expiry_date: number } | null> => {
  await ensureTokensTable();
  const result = await sql`SELECT access_token, refresh_token, expiry_date FROM console_google_tokens WHERE id = 1`;
  if (result.rows.length === 0) return null;
  const row = result.rows[0] as Record<string, unknown>;
  if (!row.refresh_token) return null;
  return {
    access_token: String(row.access_token || ''),
    refresh_token: String(row.refresh_token || ''),
    expiry_date: Number(row.expiry_date || 0),
  };
};

export const getAuthenticatedClient = async () => {
  const tokens = await getGoogleTokens();
  if (!tokens) return null;
  const client = createOAuth2Client();
  client.setCredentials(tokens);
  client.on('tokens', async (newTokens) => {
    await saveGoogleTokens(newTokens);
  });
  return client;
};
