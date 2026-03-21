'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Users, TrendingUp, BarChart3, Building2, Activity, Shield } from 'lucide-react';

type AnalyticsData = {
  totalConsoleCustomers: number;
  totalAccounts: number;
  activeConsole: number;
  endedConsole: number;
  retentionRate: string;
  industryBreakdown: { industry: string; count: number }[];
  serviceDistribution: { service: string; count: number }[];
  monthlySignups: { month: string; count: number }[];
  healthOverview: { green: number; yellow: number; red: number };
  customerKpis: Array<{
    paletteId: string;
    name: string;
    industry: string | null;
    kpis: Array<{ service: string; serviceName: string; health: string; kpi: Record<string, unknown> }>;
  }>;
};

const SERVICE_LABELS: Record<string, string> = {
  pal_studio: 'pal_studio',
  pal_base: 'pal_base',
  pal_video: 'pal_video',
  pal_opt: 'pal_opt',
  pal_ad: 'pal_ad',
  pal_trust: 'pal_trust',
  palette_ai: 'palette_ai',
  palette_console: 'palette_console',
};

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.ok) setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const maxSignup = data?.monthlySignups.reduce((m, d) => Math.max(m, d.count), 0) || 1;
  const maxService = data?.serviceDistribution.reduce((m, d) => Math.max(m, d.count), 0) || 1;
  const totalHealth = data ? data.healthOverview.green + data.healthOverview.yellow + data.healthOverview.red : 0;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <BarChart3 size={20} /> 全体分析
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Palette Console全体の利用状況</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="p-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-3 rounded w-1/2 mb-3" style={{ background: 'var(--border-primary)' }} />
              <div className="h-8 rounded w-1/3" style={{ background: 'var(--border-primary)' }} />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Console契約数</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.totalConsoleCustomers}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>全 {data.totalAccounts} アカウント中</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>継続率</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--health-green)' }}>{data.retentionRate}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                アクティブ {data.activeConsole} / 解約 {data.endedConsole}
              </p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>サービス健全性</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-1">
                  <span className="health-dot health-green" />
                  <span className="text-sm font-bold" style={{ color: 'var(--health-green)' }}>{data.healthOverview.green}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="health-dot health-yellow" />
                  <span className="text-sm font-bold" style={{ color: 'var(--health-yellow)' }}>{data.healthOverview.yellow}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="health-dot health-red" />
                  <span className="text-sm font-bold" style={{ color: 'var(--health-red)' }}>{data.healthOverview.red}</span>
                </div>
              </div>
              {totalHealth > 0 && (
                <div className="flex h-1.5 rounded-full overflow-hidden mt-2" style={{ background: 'var(--bg-input)' }}>
                  <div style={{ width: `${(data.healthOverview.green / totalHealth) * 100}%`, background: 'var(--health-green)' }} />
                  <div style={{ width: `${(data.healthOverview.yellow / totalHealth) * 100}%`, background: 'var(--health-yellow)' }} />
                  <div style={{ width: `${(data.healthOverview.red / totalHealth) * 100}%`, background: 'var(--health-red)' }} />
                </div>
              )}
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={14} style={{ color: 'var(--text-muted)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>業種数</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.industryBreakdown.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Monthly Signups */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <TrendingUp size={16} /> 月別新規契約数
              </h3>
              <div className="h-36 flex items-end gap-1">
                {data.monthlySignups.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs" style={{ color: d.count > 0 ? 'var(--text-primary)' : 'transparent' }}>{d.count}</span>
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${Math.max((d.count / maxSignup) * 100, 4)}%`,
                        background: 'var(--text-primary)',
                        opacity: 0.5,
                        minHeight: '3px',
                      }}
                    />
                    <span className="text-xs" style={{ color: 'var(--text-muted)', fontSize: '9px' }}>
                      {d.month.slice(5)}月
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Industry Breakdown */}
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Building2 size={16} /> 業種別分布
              </h3>
              <div className="space-y-3">
                {data.industryBreakdown.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>データなし</p>
                ) : (
                  data.industryBreakdown.map((d, i) => {
                    const maxIndustry = data.industryBreakdown[0]?.count || 1;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{d.industry}</span>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{d.count}社</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                          <div className="h-full rounded-full" style={{ width: `${(d.count / maxIndustry) * 100}%`, background: 'var(--text-primary)', opacity: 0.5 }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Service Distribution */}
          <div className="glass-card p-5 mb-6">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>サービス別利用状況</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {data.serviceDistribution.map((d, i) => (
                <div key={i} className="p-3 rounded-lg text-center" style={{ background: 'var(--bg-input)' }}>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{d.count}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{SERVICE_LABELS[d.service] || d.service}</p>
                  <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: 'var(--border-primary)' }}>
                    <div className="h-full rounded-full" style={{ width: `${(d.count / maxService) * 100}%`, background: 'var(--text-primary)', opacity: 0.5 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer KPI Report */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>顧客別レポート</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>顧客</th>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>業種</th>
                    <th className="text-center py-2 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>サービス数</th>
                    <th className="text-center py-2 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>健全性</th>
                    <th className="text-left py-2 px-3 font-medium" style={{ color: 'var(--text-muted)' }}>要注意サービス</th>
                  </tr>
                </thead>
                <tbody>
                  {data.customerKpis.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6" style={{ color: 'var(--text-muted)' }}>データなし</td>
                    </tr>
                  ) : (
                    data.customerKpis.map((ck) => {
                      const redKpis = ck.kpis.filter((k) => k.health === 'red');
                      const yellowKpis = ck.kpis.filter((k) => k.health === 'yellow');
                      const worstHealth = redKpis.length > 0 ? 'red' : yellowKpis.length > 0 ? 'yellow' : 'green';
                      return (
                        <tr key={ck.paletteId} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                          <td className="py-3 px-3">
                            <div>
                              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{ck.name || ck.paletteId}</span>
                              <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{ck.paletteId}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3" style={{ color: 'var(--text-secondary)' }}>{ck.industry || '-'}</td>
                          <td className="py-3 px-3 text-center" style={{ color: 'var(--text-primary)' }}>{ck.kpis.length}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`health-dot health-${worstHealth}`} />
                          </td>
                          <td className="py-3 px-3">
                            {redKpis.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {redKpis.map((k) => (
                                  <span key={k.service} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--health-red-bg)', color: 'var(--health-red)' }}>
                                    {SERVICE_LABELS[k.service] || k.service}
                                  </span>
                                ))}
                              </div>
                            ) : yellowKpis.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {yellowKpis.map((k) => (
                                  <span key={k.service} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--health-yellow-bg)', color: 'var(--health-yellow)' }}>
                                    {SERVICE_LABELS[k.service] || k.service}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-xs" style={{ color: 'var(--health-green)' }}>問題なし</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card p-12 text-center">
          <p style={{ color: 'var(--health-red)' }}>データの取得に失敗しました</p>
        </div>
      )}
    </div>
  );
}
