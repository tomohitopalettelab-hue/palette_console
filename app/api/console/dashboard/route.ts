import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, parseSessionValue, isExpired } from '@/lib/auth-session';
import { palDbGet } from '@/lib/pal-db-client';
import { fetchAllKpis } from '@/lib/kpi-aggregator';

export async function GET(req: NextRequest) {
  const session = parseSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || isExpired(session) || !session.paletteId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const paletteId = session.paletteId;

  try {
    // Fetch subscribed services from pal_db
    const subsRes = await palDbGet(`/api/service-subscriptions?paletteId=${paletteId}`);
    let subscribedServices: string[] = [];
    if (subsRes.ok) {
      const subsData = await subsRes.json();
      const subs = Array.isArray(subsData) ? subsData : subsData.subscriptions || [];
      subscribedServices = subs
        .filter((s: Record<string, unknown>) => s.status === 'active')
        .map((s: Record<string, unknown>) => String(s.service_key || s.serviceKey || ''))
        .filter((k: string) => k && k !== 'palette_ai');
    }

    // Fetch KPIs from all subscribed services
    const kpis = await fetchAllKpis(paletteId, subscribedServices);

    return NextResponse.json({
      paletteId,
      subscribedServices,
      kpis,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
