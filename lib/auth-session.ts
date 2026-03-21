export type SessionRole = 'admin' | 'customer';

export type SessionPayload = {
  role: SessionRole;
  customerId?: string;
  paletteId?: string;
  exp: number;
};

export const SESSION_COOKIE = 'palette_console_session';
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export const createSessionValue = (payload: SessionPayload): string =>
  encodeURIComponent(JSON.stringify(payload));

export const parseSessionValue = (value?: string | null): SessionPayload | null => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as SessionPayload;
    if (!parsed || !parsed.role || !parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const isExpired = (payload: SessionPayload): boolean => Date.now() > payload.exp;
