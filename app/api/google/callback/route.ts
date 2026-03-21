import { NextRequest, NextResponse } from 'next/server';
import { exchangeCode, saveGoogleTokens } from '@/lib/google-auth';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.redirect(new URL('/admin/ga-settings?error=no_code', req.url));
  }

  try {
    const tokens = await exchangeCode(code);
    await saveGoogleTokens(tokens);
    return NextResponse.redirect(new URL('/admin/ga-settings?connected=true', req.url));
  } catch (e) {
    console.error('OAuth callback error:', e);
    return NextResponse.redirect(new URL('/admin/ga-settings?error=auth_failed', req.url));
  }
}
