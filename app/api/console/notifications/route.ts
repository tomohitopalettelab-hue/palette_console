import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, parseSessionValue, isExpired } from '@/lib/auth-session';
import { getLineSettingByPaletteId } from '@/lib/console-store';
import { sendLineText } from '@/lib/line-client';

// Send LINE notification to a specific customer
export async function POST(req: NextRequest) {
  const session = parseSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || isExpired(session) || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { paletteId, message } = await req.json();
    if (!paletteId || !message) {
      return NextResponse.json({ error: 'paletteId and message are required' }, { status: 400 });
    }

    const setting = await getLineSettingByPaletteId(paletteId);
    if (!setting || !setting.lineUserId || !setting.notifyEnabled) {
      return NextResponse.json({ error: 'LINE通知が設定されていないか、無効です' }, { status: 400 });
    }

    const sent = await sendLineText(setting.lineUserId, message);
    return NextResponse.json({ ok: sent });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
