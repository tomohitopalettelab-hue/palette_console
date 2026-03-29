'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, BarChart3, Send, Clock, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

type PalOptAnalytics = {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  failedPosts: number;
  platformDistribution: Record<string, number>;
  weeklyPosts: { week: string; count: number }[];
  statusDistribution: Record<string, number>;
  sourceDistribution: Record<string, number>;
};

// ── Component ────────────────────────────────────────────────────────────────

export default function PalOptAnalyticsPage() {
  const [data, setData] = useState<PalOptAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [paletteId, setPaletteId] = useState('');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (paletteId) params.set('paletteId', paletteId);
      const res = await fetch(`/api/admin/pal-opt-analytics?${params.toString()}`);
      const body = await res.json();
      if (body.success) {
        setData(body.analytics);
      }
    } catch (error) {
      console.error('分析データの取得に失敗:', error);
    } finally {
      setLoading(false);
    }
  }, [paletteId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const maxWeeklyCount = data ? Math.max(...data.weeklyPosts.map((w) => w.count), 1) : 1;

  const statusLabels: Record<string, string> = {
    draft: '下書き',
    preview: 'プレビュー',
    pending_approval: '承認待ち',
    approved: '承認済み',
    scheduled: 'スケジュール',
    publishing: '公開中',
    published: '公開済み',
    failed: 'エラー',
  };

  const platformLabels: Record<string, string> = {
    instagram: 'Instagram',
    blog: 'ブログ',
    gbp: 'GBP',
    x: 'X (Twitter)',
  };

  const sourceLabels: Record<string, string> = {
    pal_opt: 'Pal Opt',
    pal_base: 'Pal Base',
    pal_trust: 'Pal Trust',
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--bg-primary, #f8fafc)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary, #1e293b)' }}>
              Pal Opt 分析
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted, #94a3b8)' }}>
              投稿パフォーマンスとプラットフォーム分布
            </p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={paletteId}
              onChange={(e) => setPaletteId(e.target.value)}
              placeholder="Palette ID でフィルタ"
              className="px-3 py-2 border rounded-lg text-sm"
              style={{ borderColor: 'var(--border-primary, #e2e8f0)' }}
            />
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={{ background: '#3b82f6', color: '#fff' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              更新
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5 animate-pulse" style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-primary, #e2e8f0)' }}>
                <div className="h-4 bg-slate-200 rounded w-20 mb-3" />
                <div className="h-8 bg-slate-200 rounded w-16" />
              </div>
            ))}
          </div>
        ) : data ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <SummaryCard icon={<FileText size={18} />} label="総投稿数" value={data.totalPosts} color="#3b82f6" />
              <SummaryCard icon={<CheckCircle size={18} />} label="公開済み" value={data.publishedPosts} color="#22c55e" />
              <SummaryCard icon={<BarChart3 size={18} />} label="下書き" value={data.draftPosts} color="#94a3b8" />
              <SummaryCard icon={<Clock size={18} />} label="スケジュール" value={data.scheduledPosts} color="#f59e0b" />
              <SummaryCard icon={<AlertTriangle size={18} />} label="エラー" value={data.failedPosts} color="#ef4444" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Weekly Posts Chart */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-primary, #e2e8f0)' }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary, #1e293b)' }}>
                  週別投稿数
                </h3>
                <div className="space-y-2">
                  {data.weeklyPosts.slice(-8).map((week) => (
                    <div key={week.week} className="flex items-center gap-3">
                      <span className="text-[11px] w-20 text-right" style={{ color: 'var(--text-muted, #94a3b8)' }}>
                        {week.week}
                      </span>
                      <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary, #f1f5f9)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(week.count / maxWeeklyCount) * 100}%`,
                            background: '#3b82f6',
                            minWidth: week.count > 0 ? '8px' : '0',
                          }}
                        />
                      </div>
                      <span className="text-[11px] font-bold w-6 text-right" style={{ color: 'var(--text-primary, #1e293b)' }}>
                        {week.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Platform Distribution */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-primary, #e2e8f0)' }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary, #1e293b)' }}>
                  <Send size={14} className="inline mr-2" />
                  プラットフォーム分布
                </h3>
                {(() => {
                  const total = Object.values(data.platformDistribution).reduce((a, b) => a + b, 0) || 1;
                  const colors: Record<string, string> = { instagram: '#E4405F', blog: '#21759B', gbp: '#4285F4', x: '#000000' };
                  return (
                    <div className="space-y-3">
                      {Object.entries(data.platformDistribution).map(([key, count]) => (
                        <div key={key}>
                          <div className="flex justify-between mb-1">
                            <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary, #1e293b)' }}>
                              {platformLabels[key] || key}
                            </span>
                            <span className="text-[11px]" style={{ color: 'var(--text-muted, #94a3b8)' }}>
                              {count}件 ({Math.round((count / total) * 100)}%)
                            </span>
                          </div>
                          <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-primary, #f1f5f9)' }}>
                            <div className="h-full rounded-full" style={{ width: `${(count / total) * 100}%`, background: colors[key] || '#94a3b8' }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-primary, #e2e8f0)' }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary, #1e293b)' }}>
                  ステータス分布
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(data.statusDistribution).map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--bg-primary, #f8fafc)' }}>
                      <span className="text-[11px]" style={{ color: 'var(--text-muted, #94a3b8)' }}>
                        {statusLabels[key] || key}
                      </span>
                      <span className="text-sm font-black" style={{ color: 'var(--text-primary, #1e293b)' }}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Source Distribution */}
              <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-primary, #e2e8f0)' }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary, #1e293b)' }}>
                  投稿元サービス
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {Object.entries(data.sourceDistribution).map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'var(--bg-primary, #f8fafc)' }}>
                      <span className="text-[12px] font-bold" style={{ color: 'var(--text-primary, #1e293b)' }}>
                        {sourceLabels[key] || key}
                      </span>
                      <span className="text-sm font-black" style={{ color: 'var(--text-primary, #1e293b)' }}>
                        {count}件
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

// ── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card, #fff)', border: '1px solid var(--border-primary, #e2e8f0)' }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg" style={{ background: `${color}15`, color }}>
          {icon}
        </div>
        <span className="text-[11px]" style={{ color: 'var(--text-muted, #94a3b8)' }}>{label}</span>
      </div>
      <p className="text-2xl font-black" style={{ color: 'var(--text-primary, #1e293b)' }}>{value}</p>
    </div>
  );
}
