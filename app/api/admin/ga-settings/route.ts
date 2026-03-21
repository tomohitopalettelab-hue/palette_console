import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, parseSessionValue, isExpired } from '@/lib/auth-session';
import { getAllGaScSettings, upsertGaScSetting, deleteGaScSetting, getGaScSettingByPaletteId } from '@/lib/ga-sc-store';

export async function GET(req: NextRequest) {
  const session = parseSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || isExpired(session) || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const paletteId = req.nextUrl.searchParams.get('paletteId');
  if (paletteId) {
    const setting = await getGaScSettingByPaletteId(paletteId);
    return NextResponse.json(setting);
  }

  const settings = await getAllGaScSettings();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  const session = parseSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || isExpired(session) || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body.paletteId) return NextResponse.json({ error: 'paletteId is required' }, { status: 400 });
    const result = await upsertGaScSetting(body);
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
  if (!paletteId) return NextResponse.json({ error: 'paletteId is required' }, { status: 400 });
  await deleteGaScSetting(paletteId);
  return NextResponse.json({ ok: true });
}
