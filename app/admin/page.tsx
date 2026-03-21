'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Search, ChevronRight } from 'lucide-react';

type Customer = {
  paletteId: string;
  name: string;
  status: string;
  services: string[];
  contractCount: number;
};

export default function AdminPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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
          contractCount: Number(a.contractCount || a.contract_count || 0),
        })));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = customers.filter(
    (c) =>
      c.paletteId.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>顧客一覧</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{customers.length} 件の顧客</p>
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

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="IDまたは名前で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none"
          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
        />
      </div>

      {/* Customer List */}
      <div className="space-y-2">
        {loading && customers.length === 0 ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 rounded w-1/4 mb-2" style={{ background: 'var(--border-primary)' }} />
              <div className="h-3 rounded w-1/2" style={{ background: 'var(--border-primary)' }} />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p style={{ color: 'var(--text-muted)' }}>顧客が見つかりません</p>
          </div>
        ) : (
          filtered.map((c) => (
            <div key={c.paletteId} className="glass-card p-4 flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                >
                  {c.paletteId.slice(0, 2)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name || c.paletteId}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.paletteId}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{
                        background: c.status === 'active' ? 'var(--health-green-bg)' : 'var(--bg-input)',
                        color: c.status === 'active' ? 'var(--health-green)' : 'var(--text-muted)',
                      }}
                    >
                      {c.status === 'active' ? 'アクティブ' : c.status}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
