import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_TTL_MS, createSessionValue } from '@/lib/auth-session';
import { palDbPost, palDbGet } from '@/lib/pal-db-client';

export async function POST(req: NextRequest) {
  try {
    const { loginId, password, mode } = await req.json();

    if (mode === 'admin') {
      const adminId = process.env.ADMIN_ID || 'admin';
      const adminPass = process.env.ADMIN_PASSWORD || '';
      if (loginId !== adminId || password !== adminPass) {
        return NextResponse.json({ error: 'ログインIDまたはパスワードが間違っています' }, { status: 401 });
      }
      const session = createSessionValue({ role: 'admin', exp: Date.now() + SESSION_TTL_MS });
      const res = NextResponse.json({ ok: true, role: 'admin' });
      res.cookies.set(SESSION_COOKIE, session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_TTL_MS / 1000,
        path: '/',
      });
      return res;
    }

    // Customer login via pal_db
    const dbRes = await palDbPost('/api/accounts/chat-login', { loginId, password });
    if (!dbRes.ok) {
      return NextResponse.json({ error: 'ログインIDまたはパスワードが間違っています' }, { status: 401 });
    }
    const account = await dbRes.json();
    const paletteId = account.paletteId || account.palette_id || '';
    const customerId = account.id || '';

    // Check if the customer has an active palette_console subscription
    try {
      const subsRes = await palDbGet(`/api/service-subscriptions?paletteId=${paletteId}`);
      if (subsRes.ok) {
        const subsData = await subsRes.json();
        const subs = Array.isArray(subsData) ? subsData : subsData.subscriptions || [];
        const hasConsole = subs.some(
          (s: Record<string, unknown>) =>
            (String(s.service_key || s.serviceKey || '').toLowerCase().includes('console') ||
             String(s.service_key || s.serviceKey || '').toLowerCase() === 'palette_console') &&
            s.status === 'active',
        );
        if (!hasConsole) {
          return NextResponse.json({ error: 'Palette Consoleのご契約がありません' }, { status: 403 });
        }
      }
    } catch {
      // If subscription check fails, allow login (graceful degradation)
    }

    const session = createSessionValue({
      role: 'customer',
      customerId,
      paletteId,
      exp: Date.now() + SESSION_TTL_MS,
    });
    const res = NextResponse.json({ ok: true, role: 'customer', paletteId });
    res.cookies.set(SESSION_COOKIE, session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_MS / 1000,
      path: '/',
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
