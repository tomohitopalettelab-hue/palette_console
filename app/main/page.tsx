'use client';

import { useEffect, useState } from 'react';
import { Globe, Film, Megaphone, PenTool, Star, Palette, RefreshCw } from 'lucide-react';

type ServiceKpi = {
  service: string;
  serviceName: string;
  kpi: Record<string, unknown>;
  health: 'green' | 'yellow' | 'red';
  lastActivity: string | null;
};

type DashboardData = {
  paletteId: string;
  subscribedServices: string[];
  kpis: ServiceKpi[];
};

const SERVICE_ICONS: Record<string, React.ElementType> = {
  pal_studio: Globe,
  pal_base: Palette,
  pal_video: Film,
  pal_opt: PenTool,
  pal_ad: Megaphone,
  pal_trust: Star,
};

const SERVICE_LABELS: Record<string, string> = {
  pal_studio: 'Web制作',
  pal_base: '販促ツール',
  pal_video: '動画制作',
  pal_opt: 'マーケティング',
  pal_ad: '広告運用',
  pal_trust: '顧客評価',
};

const HEALTH_LABELS: Record<string, string> = {
  green: '好調',
  yellow: '要確認',
  red: '対応が必要',
};

const formatKpiValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'number') return value.toLocaleString();
  return String(value);
};

const formatKpiLabel = (key: string): string => {
  const labels: Record<string, string> = {
    totalPages: 'ページ数',
    blogPosts: 'ブログ記事',
    lastUpdated: '最終更新',
    siteStatus: 'ステータス',
    couponGenerated: 'クーポン生成',
    bannerCreated: 'バナー作成',
    richMenuCreated: 'リッチメニュー',
    gbpProfileGenerated: 'GBPプロフィール',
    totalVideos: '動画数',
    completed: '完了',
    rendering: 'レンダリング中',
    youtubePublished: 'YouTube公開',
    totalPosts: '投稿数',
    published: '公開済み',
    draft: '下書き',
    instagramPosts: 'Instagram',
    blogPostsOpt: 'ブログ',
    gbpPosts: 'GBP',
    activeCampaigns: 'アクティブ広告',
    totalBudget: '総予算',
    budgetUsed: '予算消化',
    avgCtr: '平均CTR',
    totalResponses: '回答数',
    avgScore: '平均スコア',
    latestFeedback: '最新評価',
  };
  return labels[key] || key;
};

const relativeTime = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return '今日';
  if (days === 1) return '昨日';
  if (days < 7) return `${days}日前`;
  if (days < 30) return `${Math.floor(days / 7)}週間前`;
  return `${Math.floor(days / 30)}ヶ月前`;
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/console/dashboard');
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>ダッシュボード</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>契約中サービスの概要</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          更新
        </button>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse">
              <div className="h-4 rounded w-1/3 mb-4" style={{ background: 'var(--border-primary)' }} />
              <div className="space-y-3">
                <div className="h-3 rounded w-full" style={{ background: 'var(--border-primary)' }} />
                <div className="h-3 rounded w-2/3" style={{ background: 'var(--border-primary)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          {data.kpis.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <p style={{ color: 'var(--text-muted)' }}>契約中のサービスがありません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.kpis.map((kpi) => {
                const Icon = SERVICE_ICONS[kpi.service] || Globe;
                return (
                  <div key={kpi.service} className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-input)' }}>
                          <Icon size={18} style={{ color: 'var(--text-secondary)' }} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {SERVICE_LABELS[kpi.service] || kpi.serviceName}
                          </h3>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            最終活動: {relativeTime(kpi.lastActivity)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`health-dot health-${kpi.health}`} />
                        <span className="text-xs" style={{ color: `var(--health-${kpi.health})` }}>
                          {HEALTH_LABELS[kpi.health]}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {Object.entries(kpi.kpi).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between py-1">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatKpiLabel(key)}</span>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {formatKpiValue(key, value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="glass-card p-12 text-center">
          <p style={{ color: 'var(--health-red)' }}>データの取得に失敗しました</p>
        </div>
      )}
    </div>
  );
}
