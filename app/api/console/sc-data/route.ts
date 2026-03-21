import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, parseSessionValue, isExpired } from '@/lib/auth-session';
import { getAuthenticatedClient } from '@/lib/google-auth';
import { getGaScSettingByPaletteId } from '@/lib/ga-sc-store';
import { google } from 'googleapis';

export async function GET(req: NextRequest) {
  const session = parseSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || isExpired(session) || !session.paletteId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const paletteId = session.role === 'admin'
    ? (req.nextUrl.searchParams.get('paletteId') || session.paletteId)
    : session.paletteId;
  const days = Number(req.nextUrl.searchParams.get('days') || '30');

  try {
    const setting = await getGaScSettingByPaletteId(paletteId);
    if (!setting?.scSiteUrl) {
      return NextResponse.json({ error: 'Search Consoleが設定されていません', configured: false });
    }

    const auth = await getAuthenticatedClient();
    if (!auth) {
      return NextResponse.json({ error: 'Google認証が未設定です', configured: false });
    }

    const searchConsole = google.searchconsole({ version: 'v1', auth });
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    // Fetch search analytics
    const [overviewRes, queryRes, pageRes] = await Promise.all([
      searchConsole.searchanalytics.query({
        siteUrl: setting.scSiteUrl,
        requestBody: {
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ['date'],
          rowLimit: 100,
        },
      }),
      searchConsole.searchanalytics.query({
        siteUrl: setting.scSiteUrl,
        requestBody: {
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ['query'],
          rowLimit: 20,
        },
      }),
      searchConsole.searchanalytics.query({
        siteUrl: setting.scSiteUrl,
        requestBody: {
          startDate: fmt(startDate),
          endDate: fmt(endDate),
          dimensions: ['page'],
          rowLimit: 10,
        },
      }),
    ]);

    const dailyData = (overviewRes.data.rows || []).map((r) => ({
      date: r.keys?.[0] || '',
      clicks: r.clicks || 0,
      impressions: r.impressions || 0,
      ctr: ((r.ctr || 0) * 100).toFixed(2),
      position: (r.position || 0).toFixed(1),
    }));

    const totalClicks = dailyData.reduce((s, d) => s + d.clicks, 0);
    const totalImpressions = dailyData.reduce((s, d) => s + d.impressions, 0);
    const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';
    const avgPosition = dailyData.length > 0
      ? (dailyData.reduce((s, d) => s + Number(d.position), 0) / dailyData.length).toFixed(1)
      : '0';

    return NextResponse.json({
      configured: true,
      siteUrl: setting.scSiteUrl,
      period: `${days}days`,
      overview: {
        totalClicks,
        totalImpressions,
        avgCtr: `${avgCtr}%`,
        avgPosition,
      },
      daily: dailyData,
      topQueries: (queryRes.data.rows || []).map((r) => ({
        query: r.keys?.[0] || '',
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: ((r.ctr || 0) * 100).toFixed(2),
        position: (r.position || 0).toFixed(1),
      })),
      topPages: (pageRes.data.rows || []).map((r) => ({
        page: r.keys?.[0] || '',
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), configured: true }, { status: 500 });
  }
}
