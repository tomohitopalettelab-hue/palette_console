import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, parseSessionValue, isExpired } from '@/lib/auth-session';
import { palDbGet } from '@/lib/pal-db-client';
import { fetchAllKpis, type ServiceKpi } from '@/lib/kpi-aggregator';
import { getTrackingStats } from '@/lib/console-store';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' });

const buildPrompt = (paletteId: string, kpis: ServiceKpi[], siteStats: Record<string, unknown>) => {
  return `あなたはデジタルマーケティングの専門家です。以下の顧客データを分析し、今すぐやるべきアクションを提案してください。

顧客ID: ${paletteId}

【契約中サービスのKPIデータ】
${JSON.stringify(kpis, null, 2)}

【Webサイトアクセスデータ】
${JSON.stringify(siteStats, null, 2)}

以下のJSON形式で回答してください:
{
  "actions": [
    {
      "priority": "high" | "medium" | "low",
      "service": "サービスキー (pal_studio等)",
      "title": "アクションタイトル (30文字以内)",
      "description": "詳細説明 (80文字以内)",
      "actionLabel": "ボタンラベル (10文字以内)"
    }
  ],
  "summary": "全体サマリー (100文字以内)"
}

- highは対応が急務なもの（2週間以上の未活動、スコア低下等）
- mediumは改善余地があるもの
- lowは好調な報告
- 最大8件まで
- 日本語で回答`;
};

export async function GET(req: NextRequest) {
  const session = parseSessionValue(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session || isExpired(session) || !session.paletteId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const paletteId = session.paletteId;

  try {
    const summaryRes = await palDbGet(`/api/palette-summary?paletteId=${paletteId}`);
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

    const [kpis, siteStats] = await Promise.all([
      fetchAllKpis(paletteId, subscribedServices),
      getTrackingStats(paletteId, 30),
    ]);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: buildPrompt(paletteId, kpis, siteStats) }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 1500,
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{"actions":[],"summary":""}');

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
