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
    if (!setting?.ga4PropertyId) {
      return NextResponse.json({ error: 'GA4が設定されていません', configured: false });
    }

    const auth = await getAuthenticatedClient();
    if (!auth) {
      return NextResponse.json({ error: 'Google認証が未設定です', configured: false });
    }

    const analyticsData = google.analyticsdata({ version: 'v1beta', auth });
    const propertyId = setting.ga4PropertyId.replace('properties/', '');

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const fmt = (d: Date) => d.toISOString().split('T')[0];

    // Fetch overview metrics
    const [overviewRes, dailyRes, pagesRes, sourcesRes, devicesRes] = await Promise.all([
      analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: fmt(startDate), endDate: fmt(endDate) }],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'averageSessionDuration' },
            { name: 'bounceRate' },
          ],
        },
      }),
      analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: fmt(startDate), endDate: fmt(endDate) }],
          dimensions: [{ name: 'date' }],
          metrics: [{ name: 'sessions' }, { name: 'screenPageViews' }],
          orderBys: [{ dimension: { dimensionName: 'date' } }],
        },
      }),
      analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: fmt(startDate), endDate: fmt(endDate) }],
          dimensions: [{ name: 'pagePath' }],
          metrics: [{ name: 'screenPageViews' }],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: '10',
        },
      }),
      analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: fmt(startDate), endDate: fmt(endDate) }],
          dimensions: [{ name: 'sessionSource' }],
          metrics: [{ name: 'sessions' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: '10',
        },
      }),
      analyticsData.properties.runReport({
        property: `properties/${propertyId}`,
        requestBody: {
          dateRanges: [{ startDate: fmt(startDate), endDate: fmt(endDate) }],
          dimensions: [{ name: 'deviceCategory' }],
          metrics: [{ name: 'sessions' }],
        },
      }),
    ]);

    const getMetricValue = (row: { metricValues?: Array<{ value?: string | null }> } | undefined, idx: number) =>
      Number(row?.metricValues?.[idx]?.value || 0);

    const overviewRow = overviewRes.data.rows?.[0];

    return NextResponse.json({
      configured: true,
      propertyId,
      period: `${days}days`,
      overview: {
        sessions: getMetricValue(overviewRow, 0),
        users: getMetricValue(overviewRow, 1),
        pageViews: getMetricValue(overviewRow, 2),
        avgSessionDuration: Math.round(getMetricValue(overviewRow, 3)),
        bounceRate: (getMetricValue(overviewRow, 4) * 100).toFixed(1),
      },
      daily: (dailyRes.data.rows || []).map((r) => ({
        date: r.dimensionValues?.[0]?.value || '',
        sessions: Number(r.metricValues?.[0]?.value || 0),
        pageViews: Number(r.metricValues?.[1]?.value || 0),
      })),
      topPages: (pagesRes.data.rows || []).map((r) => ({
        path: r.dimensionValues?.[0]?.value || '',
        views: Number(r.metricValues?.[0]?.value || 0),
      })),
      sources: (sourcesRes.data.rows || []).map((r) => ({
        source: r.dimensionValues?.[0]?.value || '',
        sessions: Number(r.metricValues?.[0]?.value || 0),
      })),
      devices: (devicesRes.data.rows || []).map((r) => ({
        device: r.dimensionValues?.[0]?.value || '',
        sessions: Number(r.metricValues?.[0]?.value || 0),
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), configured: true }, { status: 500 });
  }
}
