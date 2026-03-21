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
    // Fetch contracts + plans via palette-summary
    const summaryRes = await palDbGet(`/api/palette-summary?paletteId=${paletteId}`);
    let subscribedServices: string[] = [];

    if (summaryRes.ok) {
      const summary = await summaryRes.json();
      const contracts = summary.contracts || [];
      const plans = summary.plans || [];

      const planCodeMap = new Map<string, string>();
      plans.forEach((p: Record<string, unknown>) => planCodeMap.set(String(p.id || ''), String(p.code || '')));

      // Extract unique base service keys from contracted plans
      const serviceSet = new Set<string>();
      contracts.forEach((c: Record<string, unknown>) => {
        const code = planCodeMap.get(String(c.planId || c.plan_id || '')) || '';
        if (!code || code === 'palette_console') return;
        // Normalize: pal_studio_standard -> pal_studio
        const base = code.replace(/_(lite|standard|pro)$/i, '');
        serviceSet.add(base);
      });
      subscribedServices = [...serviceSet];
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
