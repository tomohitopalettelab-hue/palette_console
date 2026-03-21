'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, Users, Eye, Smartphone, Monitor } from 'lucide-react';

type AnalyticsData = {
  paletteId: string;
  period: string;
  site: {
    totalPageViews: number;
    uniqueVisitors: number;
    dailyPageViews: { date: string; count: number }[];
    topPages: { path: string; count: number }[];
    deviceBreakdown: { device: string; count: number }[];
    topReferrers: { referrer: string; count: number }[];
  };
  services: Array<{
    service: string;
    serviceName: string;
    kpi: Record<string, unknown>;
    health: string;
  }>;
};

const periodOptions = [
  { value: '7', label: '7日間' },
  { value: '30', label: '30日間' },
  { value: '90', label: '90日間' },
];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState('30');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/console/analytics?days=${days}`);
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [days]);

  const maxPv = data?.site.dailyPageViews.reduce((m, d) => Math.max(m, d.count), 0) || 1;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>アナリティクス</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Webサイト & サービス効果分析</p>
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
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--text-secondary)' }} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>総PV</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {data?.site.totalPageViews.toLocaleString() || '-'}
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ユニーク訪問者</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {data?.site.uniqueVisitors.toLocaleString() || '-'}
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Monitor size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>PC</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {data?.site.deviceBreakdown.find((d) => d.device === 'desktop')?.count.toLocaleString() || '0'}
          </p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>モバイル</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {data?.site.deviceBreakdown.find((d) => d.device === 'mobile')?.count.toLocaleString() || '0'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily PV Chart */}
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp size={16} /> 日別ページビュー
          </h3>
          <div className="h-48 flex items-end gap-1">
            {data?.site.dailyPageViews.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${Math.max((d.count / maxPv) * 100, 2)}%`,
                    background: 'var(--text-primary)',
                    opacity: 0.6,
                    minHeight: '2px',
                  }}
                  title={`${d.date}: ${d.count} PV`}
                />
              </div>
            )) || (
              <div className="flex-1 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                データなし
              </div>
            )}
          </div>
          {data?.site.dailyPageViews && data.site.dailyPageViews.length > 0 && (
            <div className="flex justify-between mt-2">
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {data.site.dailyPageViews[0]?.date?.split('T')[0]}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {data.site.dailyPageViews[data.site.dailyPageViews.length - 1]?.date?.split('T')[0]}
              </span>
            </div>
          )}
        </div>

        {/* Top Pages */}
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>人気ページ</h3>
          <div className="space-y-3">
            {data?.site.topPages.length ? data.site.topPages.map((p, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-xs truncate max-w-[180px]" style={{ color: 'var(--text-secondary)' }}>{p.path}</span>
                <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{p.count}</span>
              </div>
            )) : (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>データなし</p>
            )}
          </div>
        </div>
      </div>

      {/* Referrers */}
      <div className="glass-card p-5 mt-4">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>流入元</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data?.site.topReferrers.length ? data.site.topReferrers.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'var(--bg-input)' }}>
              <span className="text-xs truncate max-w-[250px]" style={{ color: 'var(--text-secondary)' }}>{r.referrer}</span>
              <span className="text-xs font-medium ml-3" style={{ color: 'var(--text-primary)' }}>{r.count}</span>
            </div>
          )) : (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>データなし</p>
          )}
        </div>
      </div>
    </div>
  );
}
