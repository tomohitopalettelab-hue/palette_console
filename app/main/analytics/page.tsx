'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, Users, Eye, Smartphone, Monitor, Search, MousePointerClick, ArrowUpRight } from 'lucide-react';

type GaData = {
  configured: boolean;
  overview?: { sessions: number; users: number; pageViews: number; avgSessionDuration: number; bounceRate: string };
  daily?: { date: string; sessions: number; pageViews: number }[];
  topPages?: { path: string; views: number }[];
  sources?: { source: string; sessions: number }[];
  devices?: { device: string; sessions: number }[];
  error?: string;
};

type ScData = {
  configured: boolean;
  overview?: { totalClicks: number; totalImpressions: number; avgCtr: string; avgPosition: string };
  daily?: { date: string; clicks: number; impressions: number }[];
  topQueries?: { query: string; clicks: number; impressions: number; ctr: string; position: string }[];
  topPages?: { page: string; clicks: number; impressions: number }[];
  error?: string;
};

const periodOptions = [
  { value: '7', label: '7日間' },
  { value: '30', label: '30日間' },
  { value: '90', label: '90日間' },
];

const DEVICE_LABELS: Record<string, string> = { desktop: 'PC', mobile: 'モバイル', tablet: 'タブレット' };

export default function AnalyticsPage() {
  const [ga, setGa] = useState<GaData | null>(null);
  const [sc, setSc] = useState<ScData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('30');
  const [tab, setTab] = useState<'ga' | 'sc'>('ga');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [gaRes, scRes] = await Promise.all([
        fetch(`/api/console/ga-data?days=${days}`),
        fetch(`/api/console/sc-data?days=${days}`),
      ]);
      if (gaRes.ok) setGa(await gaRes.json());
      if (scRes.ok) setSc(await scRes.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [days]);

  const maxDaily = (tab === 'ga'
    ? ga?.daily?.reduce((m, d) => Math.max(m, d.pageViews), 0)
    : sc?.daily?.reduce((m, d) => Math.max(m, d.clicks), 0)) || 1;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}分${s}秒`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>アナリティクス</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Webサイトのアクセス解析 & 検索パフォーマンス</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-primary)' }}>
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className="px-3 py-1.5 text-xs transition-colors"
                style={{
                  background: days === opt.value ? 'var(--bg-card-hover)' : 'transparent',
                  color: days === opt.value ? 'var(--text-primary)' : 'var(--text-muted)',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button onClick={fetchData} disabled={loading} className="p-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      {/* Tab Switch */}
      <div className="flex mb-6 rounded-lg overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)', width: 'fit-content' }}>
        <button
          onClick={() => setTab('ga')}
          className="flex items-center gap-2 px-4 py-2 text-sm transition-colors"
          style={{
            background: tab === 'ga' ? 'rgba(59,130,246,0.15)' : 'transparent',
            color: tab === 'ga' ? '#3B82F6' : 'var(--text-muted)',
          }}
        >
          <Eye size={14} /> Google Analytics
        </button>
        <button
          onClick={() => setTab('sc')}
          className="flex items-center gap-2 px-4 py-2 text-sm transition-colors"
          style={{
            background: tab === 'sc' ? 'rgba(234,179,8,0.15)' : 'transparent',
            color: tab === 'sc' ? '#EAB308' : 'var(--text-muted)',
          }}
        >
          <Search size={14} /> Search Console
        </button>
      </div>

      {/* GA Tab */}
      {tab === 'ga' && (
        <>
          {!ga?.configured ? (
            <div className="glass-card p-12 text-center">
              <Eye size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>Google Analyticsが設定されていません</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>管理者にお問い合わせください</p>
            </div>
          ) : ga?.error && !ga?.overview ? (
            <div className="glass-card p-8 text-center">
              <p style={{ color: 'var(--health-red)' }}>データの取得に失敗しました</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="glass-card p-4">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>セッション</span>
                  <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{ga?.overview?.sessions?.toLocaleString()}</p>
                </div>
                <div className="glass-card p-4">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ユーザー</span>
                  <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{ga?.overview?.users?.toLocaleString()}</p>
                </div>
                <div className="glass-card p-4">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ページビュー</span>
                  <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{ga?.overview?.pageViews?.toLocaleString()}</p>
                </div>
                <div className="glass-card p-4">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>平均滞在時間</span>
                  <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{formatDuration(ga?.overview?.avgSessionDuration || 0)}</p>
                </div>
                <div className="glass-card p-4">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>直帰率</span>
                  <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{ga?.overview?.bounceRate}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div className="lg:col-span-2 glass-card p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    <TrendingUp size={16} /> 日別PV
                  </h3>
                  <div className="h-40 flex items-end gap-1">
                    {ga?.daily?.map((d, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center">
                        <div className="w-full rounded-t" style={{ height: `${Math.max((d.pageViews / maxDaily) * 100, 2)}%`, background: '#3B82F6', opacity: 0.6, minHeight: '2px' }} title={`${d.date}: ${d.pageViews} PV`} />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>デバイス</h3>
                  {ga?.devices?.map((d, i) => (
                    <div key={i} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        {d.device === 'desktop' ? <Monitor size={14} /> : <Smartphone size={14} />}
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{DEVICE_LABELS[d.device] || d.device}</span>
                      </div>
                      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{d.sessions}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>人気ページ</h3>
                  {ga?.topPages?.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5">
                      <span className="text-xs truncate max-w-[250px]" style={{ color: 'var(--text-secondary)' }}>{p.path}</span>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{p.views}</span>
                    </div>
                  ))}
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>流入元</h3>
                  {ga?.sources?.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5">
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.source || '(direct)'}</span>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{s.sessions}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* SC Tab */}
      {tab === 'sc' && (
        <>
          {!sc?.configured ? (
            <div className="glass-card p-12 text-center">
              <Search size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>Search Consoleが設定されていません</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>管理者にお問い合わせください</p>
            </div>
          ) : sc?.error && !sc?.overview ? (
            <div className="glass-card p-8 text-center">
              <p style={{ color: 'var(--health-red)' }}>データの取得に失敗しました</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MousePointerClick size={14} style={{ color: '#EAB308' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>クリック数</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{sc?.overview?.totalClicks?.toLocaleString()}</p>
                </div>
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye size={14} style={{ color: '#EAB308' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>表示回数</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{sc?.overview?.totalImpressions?.toLocaleString()}</p>
                </div>
                <div className="glass-card p-4">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>平均CTR</span>
                  <p className="text-2xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>{sc?.overview?.avgCtr}</p>
                </div>
                <div className="glass-card p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <ArrowUpRight size={14} style={{ color: '#EAB308' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>平均掲載順位</span>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{sc?.overview?.avgPosition}</p>
                </div>
              </div>

              <div className="glass-card p-5 mb-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <TrendingUp size={16} /> 日別クリック数
                </h3>
                <div className="h-40 flex items-end gap-1">
                  {sc?.daily?.map((d, i) => (
                    <div key={i} className="flex-1">
                      <div className="w-full rounded-t" style={{ height: `${Math.max((d.clicks / maxDaily) * 100, 2)}%`, background: '#EAB308', opacity: 0.6, minHeight: '2px' }} title={`${d.date}: ${d.clicks} clicks`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>検索キーワード TOP20</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                        <th className="text-left py-2 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>キーワード</th>
                        <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>クリック</th>
                        <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>表示</th>
                        <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>CTR</th>
                        <th className="text-right py-2 px-2 font-medium" style={{ color: 'var(--text-muted)' }}>順位</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sc?.topQueries?.map((q, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                          <td className="py-2 px-2" style={{ color: 'var(--text-primary)' }}>{q.query}</td>
                          <td className="py-2 px-2 text-right font-medium" style={{ color: 'var(--text-primary)' }}>{q.clicks}</td>
                          <td className="py-2 px-2 text-right" style={{ color: 'var(--text-secondary)' }}>{q.impressions}</td>
                          <td className="py-2 px-2 text-right" style={{ color: 'var(--text-secondary)' }}>{q.ctr}%</td>
                          <td className="py-2 px-2 text-right" style={{ color: 'var(--text-secondary)' }}>{q.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
