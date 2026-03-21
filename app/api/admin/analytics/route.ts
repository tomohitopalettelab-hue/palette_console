import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, parseSessionValue, isExpired } from '@/lib/auth-session';
import { palDbGet } from '@/lib/pal-db-client';
import { fetchAllKpis, type ServiceKpi } from '@/lib/kpi-aggregator';

type Account = { id: string; paletteId: string; name: string; status: string; industry: string | null; createdAt: string };
type Plan = { id: string; code: string; name: string };
type Contract = { id: string; accountId: string; planId: string; phase: string; status: string; startDate: string; endDate: string | null };

export async function GET(req: NextRequest) {
  const session = parseSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || isExpired(session) || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [accountsRes, contractsRes, plansRes] = await Promise.all([
      palDbGet('/api/accounts'),
      palDbGet('/api/contracts'),
      palDbGet('/api/plans'),
    ]);

    const allAccounts: Account[] = accountsRes.ok
      ? ((await accountsRes.json()).accounts || []).map((a: Record<string, unknown>) => ({
          id: String(a.id || ''), paletteId: String(a.paletteId || a.palette_id || ''),
          name: String(a.name || ''), status: String(a.status || ''),
          industry: a.industry ? String(a.industry) : null, createdAt: String(a.createdAt || a.created_at || ''),
        }))
      : [];

    const allContracts: Contract[] = contractsRes.ok
      ? ((await contractsRes.json()).contracts || []).map((c: Record<string, unknown>) => ({
          id: String(c.id || ''), accountId: String(c.accountId || c.account_id || ''),
          planId: String(c.planId || c.plan_id || ''), phase: String(c.phase || ''),
          status: String(c.status || ''), startDate: String(c.startDate || c.start_date || ''),
          endDate: c.endDate || c.end_date ? String(c.endDate || c.end_date) : null,
        }))
      : [];

    const allPlans: Plan[] = plansRes.ok
      ? ((await plansRes.json()).plans || []).map((p: Record<string, unknown>) => ({
          id: String(p.id || ''), code: String(p.code || ''), name: String(p.name || ''),
        }))
      : [];

    const planCodeMap = new Map<string, string>();
    allPlans.forEach((p) => planCodeMap.set(p.id, p.code));

    // Console plan IDs
    const consolePlanIds = new Set(allPlans.filter((p) => p.code.includes('console')).map((p) => p.id));

    // Console contracts & account IDs
    const consoleContracts = allContracts.filter((c) => consolePlanIds.has(c.planId));
    const consoleAccountIds = new Set(consoleContracts.map((c) => c.accountId));
    const consoleAccounts = allAccounts.filter((a) => consoleAccountIds.has(a.id));

    // Industry breakdown
    const industryMap: Record<string, number> = {};
    consoleAccounts.forEach((a) => { industryMap[a.industry || '未設定'] = (industryMap[a.industry || '未設定'] || 0) + 1; });

    // Service distribution (all contracts for console subscribers, excluding console itself)
    const serviceMap: Record<string, number> = {};
    allContracts
      .filter((c) => consoleAccountIds.has(c.accountId) && !consolePlanIds.has(c.planId))
      .forEach((c) => {
        const code = planCodeMap.get(c.planId) || '';
        const base = code.replace(/_lite|_standard|_pro/g, '');
        if (base) serviceMap[base] = (serviceMap[base] || 0) + 1;
      });

    // Retention
    const activeConsole = consoleContracts.length; // all are "contracted"
    const endedConsole = 0; // track if endDate is past
    const today = new Date().toISOString().split('T')[0];
    const ended = consoleContracts.filter((c) => c.endDate && c.endDate < today).length;
    const active = consoleContracts.length - ended;
    const retentionRate = consoleContracts.length > 0 ? ((active / consoleContracts.length) * 100).toFixed(1) : '0';

    // Monthly signups
    const monthlySignups: { month: string; count: number }[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const count = consoleContracts.filter((c) => c.startDate?.slice(0, 7) === monthStr).length;
      monthlySignups.push({ month: monthStr, count });
    }

    // KPIs for console subscribers
    const kpiResults = await Promise.allSettled(
      consoleAccounts.slice(0, 20).map(async (a) => {
        const svcCodes = allContracts
          .filter((c) => c.accountId === a.id && !consolePlanIds.has(c.planId))
          .map((c) => planCodeMap.get(c.planId) || '')
          .filter(Boolean)
          .map((code) => code.replace(/_lite|_standard|_pro/g, ''))
          .filter((v, i, arr) => arr.indexOf(v) === i);
        const kpis = await fetchAllKpis(a.paletteId, svcCodes);
        return { paletteId: a.paletteId, name: a.name, industry: a.industry, kpis };
      }),
    );

    const customerKpis = kpiResults
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<{ paletteId: string; name: string; industry: string | null; kpis: ServiceKpi[] }>).value);

    let greenCount = 0, yellowCount = 0, redCount = 0;
    customerKpis.forEach((ck) => {
      ck.kpis.forEach((k) => {
        if (k.health === 'green') greenCount++;
        else if (k.health === 'yellow') yellowCount++;
        else redCount++;
      });
    });

    return NextResponse.json({
      totalConsoleCustomers: consoleAccounts.length,
      totalAccounts: allAccounts.length,
      activeConsole: active,
      endedConsole: ended,
      retentionRate: `${retentionRate}%`,
      industryBreakdown: Object.entries(industryMap).map(([industry, count]) => ({ industry, count })).sort((a, b) => b.count - a.count),
      serviceDistribution: Object.entries(serviceMap).map(([service, count]) => ({ service, count })).sort((a, b) => b.count - a.count),
      monthlySignups,
      healthOverview: { green: greenCount, yellow: yellowCount, red: redCount },
      customerKpis,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
