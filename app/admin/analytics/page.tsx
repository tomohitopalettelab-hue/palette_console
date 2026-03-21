'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Users, BarChart3 } from 'lucide-react';

type CustomerSummary = {
  paletteId: string;
  name: string;
  status: string;
  services: string[];
};

export default function AdminAnalyticsPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.accounts || data.customers || [];
        setCustomers(list.map((a: Record<string, unknown>) => ({
          paletteId: String(a.paletteId || a.palette_id || ''),
          name: String(a.name || a.accountName || ''),
          status: String(a.status || 'active'),
          services: Array.isArray(a.services) ? a.services : [],
        })));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const activeCount = customers.filter((c) => c.status === 'active').length;
  const allServices = customers.flatMap((c) => c.services);
  const serviceCounts: Record<string, number> = {};
  allServices.forEach((s) => { serviceCounts[s] = (serviceCounts[s] || 0) + 1; });

  const SERVICE_LABELS: Record<string, string> = {
    pal_studio: 'Web制作',
    pal_base: '販促ツール',
    pal_video: '動画制作',
    pal_opt: 'マーケティング',
    pal_ad: '広告運用',
    pal_trust: '顧客評価',
    palette_ai: 'AI チャット',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <BarChart3 size={20} /> 全体分析
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>全顧客の利用状況</p>
        </div>
        <button onClick={fetchData} disabled={loading} className="p-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>総顧客数</span>
          </div>
          <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{customers.length}</p>
        </div>
        <div className="glass-card p-4">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>アクティブ</span>
          <p className="text-2xl font-bold mt-2" style={{ color: 'var(--health-green)' }}>{activeCount}</p>
        </div>
        <div className="glass-card p-4">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>非アクティブ</span>
          <p className="text-2xl font-bold mt-2" style={{ color: 'var(--text-muted)' }}>{customers.length - activeCount}</p>
        </div>
        <div className="glass-card p-4">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>総契約サービス</span>
          <p className="text-2xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{allServices.length}</p>
        </div>
      </div>

      {/* Service Distribution */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>サービス別契約数</h3>
        <div className="space-y-3">
          {Object.entries(serviceCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([service, count]) => {
              const maxCount = Math.max(...Object.values(serviceCounts));
              return (
                <div key={service}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {SERVICE_LABELS[service] || service}
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{count}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-input)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${(count / maxCount) * 100}%`, background: 'var(--text-primary)', opacity: 0.6 }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
