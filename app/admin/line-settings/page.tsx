'use client';

import { useEffect, useState } from 'react';
import { Bell, Plus, Save, Trash2, Send, RefreshCw, Check } from 'lucide-react';

type LineSetting = {
  id: number;
  paletteId: string;
  lineUserId: string | null;
  notifyEnabled: boolean;
  notifyFrequency: string;
  notifyRules: Record<string, boolean>;
};

const FREQUENCY_OPTIONS = [
  { value: 'realtime', label: 'リアルタイム', desc: '条件に合致したら即時通知' },
  { value: 'daily', label: '1日1回', desc: '毎日まとめて通知' },
  { value: 'weekly', label: '週1回', desc: '毎週月曜にまとめて通知' },
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
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ paletteId: '', lineUserId: '', notifyEnabled: true, notifyFrequency: 'realtime', notifyRules: {} as Record<string, boolean> });
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [testMsg, setTestMsg] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/line-settings');
      if (res.ok) setSettings(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/line-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        await fetchSettings();
        setShowAdd(false);
        setEditingId(null);
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async (paletteId: string) => {
    if (!confirm(`${paletteId} のLINE設定を削除しますか？`)) return;
    await fetch(`/api/admin/line-settings?paletteId=${paletteId}`, { method: 'DELETE' });
    fetchSettings();
  };

  const handleTest = async (paletteId: string) => {
    setTestResult(null);
    const res = await fetch('/api/console/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paletteId, message: testMsg || 'Palette Console テスト通知です' }),
    });
    setTestResult(res.ok ? 'sent' : 'failed');
    setTimeout(() => setTestResult(null), 3000);
  };

  const startEdit = (s: LineSetting) => {
    setEditingId(s.paletteId);
    setForm({
      paletteId: s.paletteId,
      lineUserId: s.lineUserId || '',
      notifyEnabled: s.notifyEnabled,
      notifyFrequency: s.notifyFrequency,
      notifyRules: { ...s.notifyRules },
    });
  };

  const startAdd = () => {
    setShowAdd(true);
    setEditingId(null);
    setForm({
      paletteId: '',
      lineUserId: '',
      notifyEnabled: true,
      notifyFrequency: 'realtime',
      notifyRules: Object.fromEntries(Object.keys(RULE_LABELS).map((k) => [k, true])),
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Bell size={20} /> LINE通知設定
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>顧客ごとのLINE通知を管理します</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchSettings}
            className="p-2 rounded-lg transition-colors"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button
            onClick={startAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
          >
            <Plus size={14} /> 追加
          </button>
        </div>
      </div>

      {/* Add / Edit Form */}
      {(showAdd || editingId) && (
        <div className="glass-card p-6 mb-6">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            {editingId ? `${editingId} を編集` : '新規追加'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>顧客ID (Palette ID)</label>
              <input
                type="text"
                value={form.paletteId}
                onChange={(e) => setForm({ ...form, paletteId: e.target.value.toUpperCase() })}
                disabled={!!editingId}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                placeholder="A0001"
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>LINE User ID</label>
              <input
                type="text"
                value={form.lineUserId}
                onChange={(e) => setForm({ ...form, lineUserId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>
          </div>

          {/* Enabled toggle */}
          <div className="flex items-center gap-3 mb-4 py-2">
            <button
              onClick={() => setForm({ ...form, notifyEnabled: !form.notifyEnabled })}
              className="w-10 h-5 rounded-full transition-colors relative"
              style={{ background: form.notifyEnabled ? 'var(--health-green)' : 'var(--border-primary)' }}
            >
              <div
                className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all"
                style={{ left: form.notifyEnabled ? '22px' : '2px' }}
              />
            </button>
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
              通知 {form.notifyEnabled ? 'ON' : 'OFF'}
            </span>
          </div>

          {/* Frequency */}
          <div className="mb-4">
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
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Notification Rules */}
          <div className="mb-4">
            <label className="block text-xs mb-2" style={{ color: 'var(--text-muted)' }}>通知ルール</label>
            <div className="space-y-2">
              {Object.entries(RULE_LABELS).map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors"
                  style={{ background: 'var(--bg-input)' }}
                >
                  <input
                    type="checkbox"
                    checked={form.notifyRules[key] !== false}
                    onChange={(e) => setForm({
                      ...form,
                      notifyRules: { ...form.notifyRules, [key]: e.target.checked },
                    })}
                    className="w-4 h-4 rounded accent-white"
                  />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !form.paletteId}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
            >
              <Save size={14} /> {saving ? '保存中...' : '保存'}
            </button>
            <button
              onClick={() => { setShowAdd(false); setEditingId(null); }}
              className="px-4 py-2 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border-primary)' }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* Settings List */}
      <div className="space-y-2">
        {loading && settings.length === 0 ? (
          [1, 2].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 rounded w-1/4 mb-2" style={{ background: 'var(--border-primary)' }} />
              <div className="h-3 rounded w-1/2" style={{ background: 'var(--border-primary)' }} />
            </div>
          ))
        ) : settings.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p style={{ color: 'var(--text-muted)' }}>LINE通知設定がありません</p>
          </div>
        ) : (
          settings.map((s) => (
            <div key={s.paletteId} className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ background: 'var(--bg-input)', color: 'var(--text-primary)' }}
                  >
                    {s.paletteId.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{s.paletteId}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: s.notifyEnabled ? 'var(--health-green-bg)' : 'var(--bg-input)',
                          color: s.notifyEnabled ? 'var(--health-green)' : 'var(--text-muted)',
                        }}
                      >
                        {s.notifyEnabled ? 'ON' : 'OFF'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {FREQUENCY_OPTIONS.find((f) => f.value === s.notifyFrequency)?.label || s.notifyFrequency}
                      </span>
                      {s.lineUserId && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          ID: {s.lineUserId.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(s)}
                    className="px-3 py-1.5 rounded text-xs transition-colors"
                    style={{ color: 'var(--text-secondary)', background: 'var(--bg-input)' }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleTest(s.paletteId)}
                    className="px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1"
                    style={{ color: 'var(--text-secondary)', background: 'var(--bg-input)' }}
                  >
                    <Send size={12} />
                    テスト送信
                    {testResult === 'sent' && <Check size={12} style={{ color: 'var(--health-green)' }} />}
                  </button>
                  <button
                    onClick={() => handleDelete(s.paletteId)}
                    className="p-1.5 rounded transition-colors"
                    style={{ color: 'var(--health-red)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
