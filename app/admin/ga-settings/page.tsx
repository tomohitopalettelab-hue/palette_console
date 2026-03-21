'use client';

import { useEffect, useState } from 'react';
import { Activity, Save, Search, RefreshCw, Link2, Unlink, ExternalLink } from 'lucide-react';

type GaScSetting = {
  paletteId: string;
  ga4PropertyId: string | null;
  scSiteUrl: string | null;
  notes: string | null;
};

type Customer = {
  paletteId: string;
  name: string;
};

export default function GaSettingsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<GaScSetting[]>([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [form, setForm] = useState({ paletteId: '', ga4PropertyId: '', scSiteUrl: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [settingsRes, customersRes, authRes] = await Promise.all([
        fetch('/api/admin/ga-settings'),
        fetch('/api/admin/customers'),
        fetch('/api/google/auth?action=status'),
      ]);
      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers((data.customers || []).map((c: Record<string, unknown>) => ({
          paletteId: String(c.paletteId || ''),
          name: String(c.name || ''),
        })));
      }
      if (authRes.ok) {
        const data = await authRes.json();
        setGoogleConnected(data.connected);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const selectCustomer = (paletteId: string) => {
    setSelectedCustomer(paletteId);
    const existing = settings.find((s) => s.paletteId === paletteId);
    setForm({
      paletteId,
      ga4PropertyId: existing?.ga4PropertyId || '',
      scSiteUrl: existing?.scSiteUrl || '',
      notes: existing?.notes || '',
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/admin/ga-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      await fetchAll();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const filteredCustomers = customers.filter(
    (c) => c.paletteId.toLowerCase().includes(customerSearch.toLowerCase()) || c.name.toLowerCase().includes(customerSearch.toLowerCase()),
  );

  const getSettingFor = (pid: string) => settings.find((s) => s.paletteId === pid);
  const selectedName = customers.find((c) => c.paletteId === selectedCustomer)?.name || selectedCustomer;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Activity size={20} /> Google Analytics / Search Console 設定
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>顧客ごとにGA4とSearch Consoleを設定</p>
        </div>
        <button onClick={fetchAll} className="p-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Google Connection Status */}
      <div className="glass-card p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: googleConnected ? 'var(--health-green-bg)' : 'var(--health-red-bg)' }}>
            {googleConnected ? <Link2 size={16} style={{ color: 'var(--health-green)' }} /> : <Unlink size={16} style={{ color: 'var(--health-red)' }} />}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Google連携: {googleConnected ? '接続済み' : '未接続'}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {googleConnected ? 'Analytics APIとSearch Console APIが利用可能です' : 'Google認証を行ってください'}
            </p>
          </div>
        </div>
        <a
          href="/api/google/auth"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: googleConnected ? 'var(--bg-input)' : 'var(--text-primary)',
            color: googleConnected ? 'var(--text-secondary)' : 'var(--bg-primary)',
          }}
        >
          <ExternalLink size={14} />
          {googleConnected ? '再認証' : 'Googleと連携する'}
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Customer List */}
        <div className="lg:col-span-1">
          <div className="glass-card p-4">
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="顧客を検索..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-xs outline-none"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
              />
            </div>
            <div className="space-y-1 max-h-[55vh] overflow-y-auto custom-scrollbar">
              {filteredCustomers.map((c) => {
                const hasSetting = !!getSettingFor(c.paletteId);
                const setting = getSettingFor(c.paletteId);
                const isActive = selectedCustomer === c.paletteId;
                return (
                  <button
                    key={c.paletteId}
                    onClick={() => selectCustomer(c.paletteId)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                    style={{
                      background: isActive ? 'var(--bg-card-hover)' : 'transparent',
                      borderLeft: isActive ? '2px solid var(--text-primary)' : '2px solid transparent',
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{c.name || c.paletteId}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.paletteId}</span>
                        {hasSetting && (
                          <div className="flex gap-1">
                            {setting?.ga4PropertyId && <span className="text-xs px-1 rounded" style={{ background: 'rgba(59,130,246,0.15)', color: '#3B82F6' }}>GA</span>}
                            {setting?.scSiteUrl && <span className="text-xs px-1 rounded" style={{ background: 'rgba(234,179,8,0.15)', color: '#EAB308' }}>SC</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="lg:col-span-2">
          {selectedCustomer === null ? (
            <div className="glass-card p-12 text-center">
              <Activity size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>左の顧客一覧から顧客を選択してください</p>
            </div>
          ) : (
            <div className="glass-card p-6">
              <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>{selectedName}</h3>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedCustomer}</span>

              <div className="mt-6 space-y-5">
                {/* GA4 Property ID */}
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: '#3B82F6' }}>Google Analytics 4 — プロパティID</label>
                  <input
                    type="text"
                    value={form.ga4PropertyId}
                    onChange={(e) => setForm({ ...form, ga4PropertyId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                    placeholder="例: 123456789"
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    GA4の管理画面 → プロパティ設定 → プロパティID（数字のみ）
                  </p>
                </div>

                {/* Search Console Site URL */}
                <div>
                  <label className="block text-xs mb-1.5 font-medium" style={{ color: '#EAB308' }}>Search Console — サイトURL</label>
                  <input
                    type="text"
                    value={form.scSiteUrl}
                    onChange={(e) => setForm({ ...form, scSiteUrl: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                    placeholder="例: https://example.com/ または sc-domain:example.com"
                  />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Search Consoleのプロパティ一覧に表示されるURL
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>メモ</label>
                  <input
                    type="text"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                    placeholder="任意のメモ"
                  />
                </div>

                {/* GA4 Tag info */}
                <div className="p-4 rounded-lg" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)' }}>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>お客さんに設置してもらうタグ</p>
                  {form.ga4PropertyId ? (
                    <code className="text-xs block p-3 rounded overflow-x-auto" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>
                      {`<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-${form.ga4PropertyId}"></script>\n<script>\nwindow.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-${form.ga4PropertyId}');\n</script>`}
                    </code>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>プロパティIDを入力するとタグが表示されます</p>
                  )}
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    background: saving ? 'var(--border-primary)' : 'var(--text-primary)',
                    color: saving ? 'var(--text-muted)' : 'var(--bg-primary)',
                  }}
                >
                  <Save size={14} /> {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
