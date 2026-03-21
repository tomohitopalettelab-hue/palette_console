import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, SESSION_TTL_MS, createSessionValue } from '@/lib/auth-session';
import { palDbPost } from '@/lib/pal-db-client';

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
