import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, parseSessionValue, isExpired } from '@/lib/auth-session';
import { getTrackingStats } from '@/lib/console-store';
import { fetchAllKpis } from '@/lib/kpi-aggregator';
import { palDbGet } from '@/lib/pal-db-client';

export async function GET(req: NextRequest) {
  const session = parseSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || isExpired(session) || !session.paletteId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const paletteId = session.paletteId;
  const days = Number(req.nextUrl.searchParams.get('days') || '30');

  try {
    const [siteStats, subsRes] = await Promise.all([
      getTrackingStats(paletteId, days),
      palDbGet(`/api/service-subscriptions?paletteId=${paletteId}`),
    ]);

    let subscribedServices: string[] = [];
    if (subsRes.ok) {
      const subsData = await subsRes.json();
      const subs = Array.isArray(subsData) ? subsData : subsData.subscriptions || [];
      subscribedServices = subs
        .filter((s: Record<string, unknown>) => s.status === 'active')
        .map((s: Record<string, unknown>) => String(s.service_key || s.serviceKey || ''))
        .filter((k: string) => k && k !== 'palette_ai');
    }

    const kpis = await fetchAllKpis(paletteId, subscribedServices);

    return NextResponse.json({
      paletteId,
      period: `${days}days`,
      site: siteStats,
      services: kpis,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
