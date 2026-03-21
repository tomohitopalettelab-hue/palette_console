import { createHmac } from 'crypto';

const getSecret = (): string => process.env.CONSOLE_SSO_SECRET?.trim() || 'palette-console-sso-default';

export const generateSsoToken = (paletteId: string): string => {
  const ts = Date.now();
  const payload = `${paletteId}:${ts}`;
  const sig = createHmac('sha256', getSecret()).update(payload).digest('hex').slice(0, 32);
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
};

export const verifySsoToken = (token: string, maxAgeMs = 5 * 60 * 1000): { paletteId: string } | null => {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const [paletteId, tsStr, sig] = decoded.split(':');
    if (!paletteId || !tsStr || !sig) return null;

    const ts = Number(tsStr);
    if (Date.now() - ts > maxAgeMs) return null;

    const expected = createHmac('sha256', getSecret()).update(`${paletteId}:${tsStr}`).digest('hex').slice(0, 32);
    if (sig !== expected) return null;

    return { paletteId };
  } catch {
    return null;
  }
};
