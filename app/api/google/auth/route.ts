import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, parseSessionValue, isExpired } from '@/lib/auth-session';
import { getAuthUrl, getGoogleTokens } from '@/lib/google-auth';

export async function GET(req: NextRequest) {
  const session = parseSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || isExpired(session) || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = req.nextUrl.searchParams.get('action');

  if (action === 'status') {
    const tokens = await getGoogleTokens();
    return NextResponse.json({ connected: !!tokens });
  }

  // Redirect to Google OAuth
  const url = getAuthUrl();
  return NextResponse.redirect(url);
}
