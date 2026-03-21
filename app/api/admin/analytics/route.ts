import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, parseSessionValue, isExpired } from '@/lib/auth-session';
import { palDbGet } from '@/lib/pal-db-client';
import { fetchAllKpis } from '@/lib/kpi-aggregator';

type Account = {
  id: string;
  paletteId: string;
  name: string;
  status: string;
  industry: string | null;
  createdAt: string;
};

type Subscription = {
  accountId: string;
  serviceKey: string;
  status: string;
  startDate: string;
  endDate: string | null;
};

export async function GET(req: NextRequest) {
  const session = parseSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || isExpired(session) || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [accountsRes, subsRes] = await Promise.all([
      palDbGet('/api/accounts'),
      palDbGet('/api/service-subscriptions'),
    ]);

    const allAccounts: Account[] = accountsRes.ok
      ? ((await accountsRes.json()).accounts || []).map((a: Record<string, unknown>) => ({
          id: String(a.id || ''),
          paletteId: String(a.paletteId || a.palette_id || ''),
          name: String(a.name || ''),
          status: String(a.status || ''),
          industry: a.industry ? String(a.industry) : null,
          createdAt: String(a.createdAt || a.created_at || ''),
        }))
      : [];

    let allSubs: Subscription[] = [];
    if (subsRes.ok) {
      allSubs = ((await subsRes.json()).services || []).map((s: Record<string, unknown>) => ({
        accountId: String(s.accountId || s.account_id || ''),
        serviceKey: String(s.serviceKey || s.service_key || ''),
        status: String(s.status || ''),
        startDate: String(s.startDate || s.start_date || ''),
        endDate: s.endDate || s.end_date ? String(s.endDate || s.end_date) : null,
      }));
    }

    // Console subscribers
    const consoleAccountIds = new Set(
      allSubs.filter((s) => s.serviceKey === 'palette_console' && s.status === 'active').map((s) => s.accountId),
    );
    const consoleAccounts = allAccounts.filter((a) => consoleAccountIds.has(a.id));

    // Industry breakdown
    const industryMap: Record<string, number> = {};
    consoleAccounts.forEach((a) => {
      const key = a.industry || '未設定';
      industryMap[key] = (industryMap[key] || 0) + 1;
    });

    // Service distribution among console subscribers
    const serviceMap: Record<string, number> = {};
    allSubs
      .filter((s) => consoleAccountIds.has(s.accountId) && s.status === 'active' && s.serviceKey !== 'palette_console')
      .forEach((s) => {
        serviceMap[s.serviceKey] = (serviceMap[s.serviceKey] || 0) + 1;
      });

    // Retention: active vs ended subscriptions for console
    const consoleSubs = allSubs.filter((s) => s.serviceKey === 'palette_console');
    const activeConsole = consoleSubs.filter((s) => s.status === 'active').length;
    const endedConsole = consoleSubs.filter((s) => s.status !== 'active').length;
    const retentionRate = consoleSubs.length > 0
      ? ((activeConsole / consoleSubs.length) * 100).toFixed(1)
      : '0';

    // Monthly signups (last 12 months)
    const monthlySignups: { month: string; count: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const count = consoleSubs.filter((s) => {
        const sd = s.startDate?.slice(0, 7);
        return sd === monthStr;
      }).length;
      monthlySignups.push({ month: monthStr, count });
    }

    // Fetch KPIs for all console subscribers (parallel, limited)
    const kpiResults = await Promise.allSettled(
      consoleAccounts.slice(0, 20).map(async (a) => {
        const svcKeys = allSubs
          .filter((s) => s.accountId === a.id && s.status === 'active' && s.serviceKey !== 'palette_console')
          .map((s) => s.serviceKey);
        const kpis = await fetchAllKpis(a.paletteId, svcKeys);
        return { paletteId: a.paletteId, name: a.name, industry: a.industry, kpis };
      }),
    );

    const customerKpis = kpiResults
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<{ paletteId: string; name: string; industry: string | null; kpis: Record<string, unknown>[] }>).value);

    // Health overview
    let greenCount = 0, yellowCount = 0, redCount = 0;
    customerKpis.forEach((ck) => {
      (ck.kpis as Array<{ health: string }>).forEach((k) => {
        if (k.health === 'green') greenCount++;
        else if (k.health === 'yellow') yellowCount++;
        else redCount++;
      });
    });

    return NextResponse.json({
      totalConsoleCustomers: consoleAccounts.length,
      totalAccounts: allAccounts.length,
      activeConsole,
      endedConsole,
      retentionRate: `${retentionRate}%`,
      industryBreakdown: Object.entries(industryMap)
        .map(([industry, count]) => ({ industry, count }))
        .sort((a, b) => b.count - a.count),
      serviceDistribution: Object.entries(serviceMap)
        .map(([service, count]) => ({ service, count }))
        .sort((a, b) => b.count - a.count),
      monthlySignups,
      healthOverview: { green: greenCount, yellow: yellowCount, red: redCount },
      customerKpis,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
