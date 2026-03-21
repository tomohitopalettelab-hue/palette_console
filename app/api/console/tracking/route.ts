import { NextRequest, NextResponse } from 'next/server';
import { insertTrackingEvent } from '@/lib/console-store';

// CORS headers for cross-origin tracking from pal_studio sites
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { paletteId, pagePath, eventType, referrer, userAgent, deviceType, sessionId } = body;

    if (!paletteId || !pagePath) {
      return NextResponse.json({ error: 'paletteId and pagePath are required' }, { status: 400, headers: corsHeaders });
    }

    await insertTrackingEvent({
      paletteId: String(paletteId).trim().toUpperCase(),
      pagePath: String(pagePath),
      eventType: eventType || 'pageview',
      referrer: referrer || undefined,
      userAgent: userAgent || undefined,
      deviceType: deviceType || undefined,
      sessionId: sessionId || undefined,
    });

    return NextResponse.json({ ok: true }, { headers: corsHeaders });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500, headers: corsHeaders });
  }
}
