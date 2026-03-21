import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, parseSessionValue, isExpired } from '@/lib/auth-session';
import { getAllLineSettings, upsertLineSetting, deleteLineSetting, getLineSettingByPaletteId } from '@/lib/console-store';
import { sendLineText } from '@/lib/line-client';

export async function GET(req: NextRequest) {
  const session = parseSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || isExpired(session) || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const paletteId = req.nextUrl.searchParams.get('paletteId');
  if (paletteId) {
    const setting = await getLineSettingByPaletteId(paletteId);
    return NextResponse.json(setting);
  }

  const settings = await getAllLineSettings();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const session = parseSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || isExpired(session) || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { paletteId, lineUserId, notifyEnabled, notifyFrequency, notifyRules } = body;
    if (!paletteId) {
      return NextResponse.json({ error: 'paletteId is required' }, { status: 400 });
    }

    const result = await upsertLineSetting({ paletteId, lineUserId, notifyEnabled, notifyFrequency, notifyRules });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = parseSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || isExpired(session) || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const paletteId = req.nextUrl.searchParams.get('paletteId');
  if (!paletteId) {
    return NextResponse.json({ error: 'paletteId is required' }, { status: 400 });
  }

  await deleteLineSetting(paletteId);
  return NextResponse.json({ ok: true });
}
