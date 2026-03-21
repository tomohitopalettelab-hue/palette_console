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

type Subscription = {
  id: string;
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
    // Fetch all accounts
    const accountsRes = await palDbGet('/api/accounts');
    if (!accountsRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }
    const accountsData = await accountsRes.json();
    const allAccounts: Account[] = (accountsData.accounts || []).map((a: Record<string, unknown>) => ({
      id: String(a.id || ''),
      paletteId: String(a.paletteId || a.palette_id || ''),
      name: String(a.name || ''),
      contactEmail: a.contactEmail || a.contact_email || null,
      status: String(a.status || ''),
      industry: a.industry ? String(a.industry) : null,
      createdAt: String(a.createdAt || a.created_at || ''),
      updatedAt: String(a.updatedAt || a.updated_at || ''),
    }));

    // Fetch all service subscriptions (no filter = all)
    const subsRes = await palDbGet('/api/service-subscriptions');
    let allSubs: Subscription[] = [];
    if (subsRes.ok) {
      const subsData = await subsRes.json();
      allSubs = (subsData.services || []).map((s: Record<string, unknown>) => ({
        id: String(s.id || ''),
        accountId: String(s.accountId || s.account_id || ''),
        serviceKey: String(s.serviceKey || s.service_key || ''),
        status: String(s.status || ''),
        startDate: String(s.startDate || s.start_date || ''),
        endDate: s.endDate || s.end_date || null,
      }));
    }

    // Find accounts that have an active palette_console subscription
    const consoleAccountIds = new Set(
      allSubs
        .filter((s) => s.serviceKey === 'palette_console' && s.status === 'active')
        .map((s) => s.accountId),
    );

    // Build per-account service list
    const subsByAccount = new Map<string, string[]>();
    allSubs.forEach((s) => {
      if (s.status !== 'active') return;
      const list = subsByAccount.get(s.accountId) || [];
      list.push(s.serviceKey);
      subsByAccount.set(s.accountId, list);
    });

    // Filter to only palette_console subscribers
    const customers = allAccounts
      .filter((a) => consoleAccountIds.has(a.id))
      .map((a) => ({
        ...a,
        services: subsByAccount.get(a.id) || [],
      }));

    return NextResponse.json({ customers });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
