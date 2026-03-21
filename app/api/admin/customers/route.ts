import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, parseSessionValue, isExpired } from '@/lib/auth-session';
import { palDbGet } from '@/lib/pal-db-client';

type Account = {
  id: string;
  paletteId: string;
  name: string;
  contactEmail: string | null;
  status: string;
  industry: string | null;
  createdAt: string;
  updatedAt: string;
};

type Plan = {
  id: string;
  code: string;
  name: string;
};

type Contract = {
  id: string;
  accountId: string;
  planId: string;
  phase: string;
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
    // Fetch all accounts, contracts, and plans in parallel
    const [accountsRes, contractsRes, plansRes] = await Promise.all([
      palDbGet('/api/accounts'),
      palDbGet('/api/contracts'),
      palDbGet('/api/plans'),
    ]);

    const allAccounts: Account[] = accountsRes.ok
      ? ((await accountsRes.json()).accounts || []).map((a: Record<string, unknown>) => ({
          id: String(a.id || ''),
          paletteId: String(a.paletteId || a.palette_id || ''),
          name: String(a.name || ''),
          contactEmail: a.contactEmail || a.contact_email || null,
          status: String(a.status || ''),
          industry: a.industry ? String(a.industry) : null,
          createdAt: String(a.createdAt || a.created_at || ''),
          updatedAt: String(a.updatedAt || a.updated_at || ''),
        }))
      : [];

    const allContracts: Contract[] = contractsRes.ok
      ? ((await contractsRes.json()).contracts || []).map((c: Record<string, unknown>) => ({
          id: String(c.id || ''),
          accountId: String(c.accountId || c.account_id || ''),
          planId: String(c.planId || c.plan_id || ''),
          phase: String(c.phase || ''),
          status: String(c.status || ''),
          startDate: String(c.startDate || c.start_date || ''),
          endDate: c.endDate || c.end_date ? String(c.endDate || c.end_date) : null,
        }))
      : [];

    const allPlans: Plan[] = plansRes.ok
      ? ((await plansRes.json()).plans || []).map((p: Record<string, unknown>) => ({
          id: String(p.id || ''),
          code: String(p.code || ''),
          name: String(p.name || ''),
        }))
      : [];

    // Build plan ID → code map
    const planCodeMap = new Map<string, string>();
    allPlans.forEach((p) => planCodeMap.set(p.id, p.code));

    // Find account IDs that have a palette_console contract
    const consoleAccountIds = new Set(
      allContracts
        .filter((c) => {
          const code = planCodeMap.get(c.planId) || '';
          return code === 'palette_console' || code.includes('console');
        })
        .map((c) => c.accountId),
    );

    // Build per-account contracted services list
    const servicesByAccount = new Map<string, string[]>();
    allContracts.forEach((c) => {
      const code = planCodeMap.get(c.planId) || '';
      if (!code) return;
      const list = servicesByAccount.get(c.accountId) || [];
      if (!list.includes(code)) list.push(code);
      servicesByAccount.set(c.accountId, list);
    });

    // Filter to palette_console subscribers
    const customers = allAccounts
      .filter((a) => consoleAccountIds.has(a.id))
      .map((a) => ({
        ...a,
        services: servicesByAccount.get(a.id) || [],
      }));

    return NextResponse.json({ customers });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
