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
    const [siteStats, summaryRes] = await Promise.all([
      getTrackingStats(paletteId, days),
      palDbGet(`/api/palette-summary?paletteId=${paletteId}`),
    ]);

    let subscribedServices: string[] = [];
    if (summaryRes.ok) {
      const summary = await summaryRes.json();
      const contracts = summary.contracts || [];
      const plans = summary.plans || [];
      const planCodeMap = new Map<string, string>();
      plans.forEach((p: Record<string, unknown>) => planCodeMap.set(String(p.id || ''), String(p.code || '')));

      const serviceSet = new Set<string>();
      contracts.forEach((c: Record<string, unknown>) => {
        const code = planCodeMap.get(String(c.planId || c.plan_id || '')) || '';
        if (!code || code === 'palette_console') return;
        serviceSet.add(code.replace(/_(lite|standard|pro)$/i, ''));
      });
      subscribedServices = [...serviceSet];
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
