'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Search, ChevronRight, Globe, Film, PenTool, Megaphone, Star, Palette, Building2 } from 'lucide-react';

type Customer = {
  paletteId: string;
  name: string;
  status: string;
  industry: string | null;
  contactEmail: string | null;
  services: string[];
  createdAt: string;
};

const SERVICE_ICONS: Record<string, React.ElementType> = {
  pal_studio: Globe,
  pal_base: Palette,
  pal_video: Film,
  pal_opt: PenTool,
  pal_ad: Megaphone,
  pal_trust: Star,
};

const SERVICE_SHORT: Record<string, string> = {
  pal_studio: 'Studio',
  pal_base: 'Base',
  pal_video: 'Video',
  pal_opt: 'Opt',
  pal_ad: 'Ad',
  pal_trust: 'Trust',
  palette_ai: 'AI',
  palette_console: 'Console',
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
        setCustomers((data.customers || []).map((a: Record<string, unknown>) => ({
          paletteId: String(a.paletteId || ''),
          name: String(a.name || ''),
          status: String(a.status || 'active'),
          industry: a.industry ? String(a.industry) : null,
          contactEmail: a.contactEmail ? String(a.contactEmail) : null,
          services: Array.isArray(a.services) ? a.services as string[] : [],
          createdAt: String(a.createdAt || ''),
        })));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = customers.filter(
    (c) =>
      c.paletteId.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>顧客一覧</h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Palette Console契約中: {customers.length} 件
          </p>
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

      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="ID・名前・業種で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none"
          style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
        />
      </div>

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
            <p style={{ color: 'var(--text-muted)' }}>
              {customers.length === 0 ? 'Palette Consoleを契約中の顧客がいません' : '検索に一致する顧客がありません'}
            </p>
          </div>
        ) : (
          filtered.map((c) => (
            <div key={c.paletteId} className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    {c.paletteId.slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.name || c.paletteId}</h3>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.paletteId}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {c.industry && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                          <Building2 size={10} />
                          {c.industry}
                        </span>
                      )}
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
                    {/* Services */}
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      {c.services.filter((s) => s !== 'palette_console').map((s) => (
                        <span
                          key={s}
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--border-primary)', color: 'var(--text-muted)' }}
                        >
                          {SERVICE_SHORT[s] || s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
