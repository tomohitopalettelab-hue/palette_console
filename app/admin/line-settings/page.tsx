'use client';

import { useEffect, useState } from 'react';
import { Bell, Save, Trash2, Send, RefreshCw, Check, X, Search } from 'lucide-react';

type LineSetting = {
  id: number;
  paletteId: string;
  lineUserId: string | null;
  notifyEnabled: boolean;
  notifyFrequency: string;
  notifyRules: Record<string, boolean>;
};

type Customer = {
  paletteId: string;
  name: string;
  industry: string | null;
};

const FREQUENCY_OPTIONS = [
  { value: 'realtime', label: 'リアルタイム', desc: '条件合致で即時通知' },
  { value: 'daily', label: '1日1回', desc: '毎日まとめて通知' },
  { value: 'weekly', label: '週1回', desc: '毎週月曜に通知' },
];

const RULE_LABELS: Record<string, string> = {
  pal_opt_inactive: '投稿が一定期間ない場合',
  pal_trust_low_score: '低評価フィードバック受信時',
  pal_ad_budget_alert: '広告予算アラート',
  pal_video_complete: '動画レンダリング完了時',
  pal_ad_campaign_end: 'キャンペーン終了時',
  pal_studio_update: 'サイト更新関連',
  pal_base_activity: '販促ツール利用通知',
};

export default function LineSettingsPage() {
  const [settings, setSettings] = useState<LineSetting[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [form, setForm] = useState({ paletteId: '', lineUserId: '', notifyEnabled: true, notifyFrequency: 'realtime', notifyRules: {} as Record<string, boolean> });
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [settingsRes, customersRes] = await Promise.all([
        fetch('/api/admin/line-settings'),
        fetch('/api/admin/customers'),
      ]);
      if (settingsRes.ok) setSettings(await settingsRes.json());
      if (customersRes.ok) {
        const data = await customersRes.json();
        setCustomers((data.customers || []).map((c: Record<string, unknown>) => ({
          paletteId: String(c.paletteId || ''),
          name: String(c.name || ''),
          industry: c.industry ? String(c.industry) : null,
        })));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const getSettingForCustomer = (paletteId: string): LineSetting | undefined =>
    settings.find((s) => s.paletteId === paletteId);

  const selectCustomer = (paletteId: string) => {
    setSelectedCustomer(paletteId);
    const existing = getSettingForCustomer(paletteId);
    if (existing) {
      setForm({
        paletteId: existing.paletteId,
        lineUserId: existing.lineUserId || '',
        notifyEnabled: existing.notifyEnabled,
        notifyFrequency: existing.notifyFrequency,
        notifyRules: { ...existing.notifyRules },
      });
    } else {
      setForm({
        paletteId,
        lineUserId: '',
        notifyEnabled: true,
        notifyFrequency: 'realtime',
        notifyRules: Object.fromEntries(Object.keys(RULE_LABELS).map((k) => [k, true])),
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/line-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) await fetchAll();
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (paletteId: string) => {
    if (!confirm(`${paletteId} のLINE設定を削除しますか？`)) return;
    await fetch(`/api/admin/line-settings?paletteId=${paletteId}`, { method: 'DELETE' });
    if (selectedCustomer === paletteId) setSelectedCustomer(null);
    fetchAll();
  };

  const handleTest = async (paletteId: string) => {
    setTestResult(null);
    const res = await fetch('/api/console/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paletteId, message: 'Palette Console テスト通知です' }),
    });
    setTestResult(res.ok ? 'sent' : 'failed');
    setTimeout(() => setTestResult(null), 3000);
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.paletteId.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.name.toLowerCase().includes(customerSearch.toLowerCase()),
  );

  const selectedName = customers.find((c) => c.paletteId === selectedCustomer)?.name || selectedCustomer;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Bell size={20} /> LINE通知設定
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>顧客ごとにLINE通知を設定</p>
        </div>
        <button onClick={fetchAll} className="p-2 rounded-lg" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Customer List (left panel) */}
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
            <div className="space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {filteredCustomers.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'var(--text-muted)' }}>顧客がありません</p>
              ) : (
                filteredCustomers.map((c) => {
                  const hasSetting = !!getSettingForCustomer(c.paletteId);
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
                          {hasSetting && (
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: getSettingForCustomer(c.paletteId)?.notifyEnabled ? 'var(--health-green)' : 'var(--text-muted)' }} />
                          )}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.paletteId}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Setting Detail (right panel) */}
        <div className="lg:col-span-2">
          {selectedCustomer === null ? (
            <div className="glass-card p-12 text-center">
              <Bell size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p style={{ color: 'var(--text-muted)' }}>左の顧客一覧から顧客を選択してください</p>
            </div>
          ) : (
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedName}</h3>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedCustomer}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getSettingForCustomer(selectedCustomer) && (
                    <>
                      <button
                        onClick={() => handleTest(selectedCustomer)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded text-xs"
                        style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
                      >
                        <Send size={12} /> テスト送信
                        {testResult === 'sent' && <Check size={12} style={{ color: 'var(--health-green)' }} />}
                        {testResult === 'failed' && <X size={12} style={{ color: 'var(--health-red)' }} />}
                      </button>
                      <button
                        onClick={() => handleDelete(selectedCustomer)}
                        className="p-1.5 rounded"
                        style={{ color: 'var(--health-red)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* LINE User ID */}
              <div className="mb-5">
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>LINE User ID</label>
                <input
                  type="text"
                  value={form.lineUserId}
                  onChange={(e) => setForm({ ...form, lineUserId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                  placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                />
              </div>

              {/* Toggle */}
              <div className="flex items-center gap-3 mb-5 py-2">
                <button
                  onClick={() => setForm({ ...form, notifyEnabled: !form.notifyEnabled })}
                  className="w-10 h-5 rounded-full transition-colors relative"
                  style={{ background: form.notifyEnabled ? 'var(--health-green)' : 'var(--border-primary)' }}
                >
                  <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all" style={{ left: form.notifyEnabled ? '22px' : '2px' }} />
                </button>
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>通知 {form.notifyEnabled ? 'ON' : 'OFF'}</span>
              </div>

              {/* Frequency */}
              <div className="mb-5">
                <label className="block text-xs mb-2" style={{ color: 'var(--text-muted)' }}>通知頻度</label>
                <div className="grid grid-cols-3 gap-2">
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setForm({ ...form, notifyFrequency: opt.value })}
                      className="p-3 rounded-lg text-left transition-colors"
                      style={{
                        background: form.notifyFrequency === opt.value ? 'var(--bg-card-hover)' : 'var(--bg-input)',
                        border: `1px solid ${form.notifyFrequency === opt.value ? 'var(--text-primary)' : 'var(--border-primary)'}`,
                      }}
                    >
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{opt.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rules */}
              <div className="mb-6">
                <label className="block text-xs mb-2" style={{ color: 'var(--text-muted)' }}>通知ルール</label>
                <div className="space-y-1.5">
                  {Object.entries(RULE_LABELS).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors" style={{ background: 'var(--bg-input)' }}>
                      <input
                        type="checkbox"
                        checked={form.notifyRules[key] !== false}
                        onChange={(e) => setForm({ ...form, notifyRules: { ...form.notifyRules, [key]: e.target.checked } })}
                        className="w-4 h-4 rounded accent-white"
                      />
                      <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || !form.lineUserId}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: saving || !form.lineUserId ? 'var(--border-primary)' : 'var(--text-primary)',
                  color: saving || !form.lineUserId ? 'var(--text-muted)' : 'var(--bg-primary)',
                }}
              >
                <Save size={14} /> {saving ? '保存中...' : '保存'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
