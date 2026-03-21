'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Globe, Activity, Search, Bell, ExternalLink, Link2, Unlink, Copy, Check } from 'lucide-react';

type CustomerData = {
  paletteId: string;
  name: string;
  industry: string | null;
  contactEmail: string | null;
  status: string;
  services: string[];
};

type GaScData = {
  ga4PropertyId: string;
  ga4MeasurementId: string;
  scSiteUrl: string;
  hpUrl: string;
  notes: string;
};

type LineData = {
  lineUserId: string;
  notifyEnabled: boolean;
  notifyFrequency: string;
  notifyRules: Record<string, boolean>;
};

const RULE_LABELS: Record<string, string> = {
  pal_opt_inactive: '投稿が一定期間ない場合',
  pal_trust_low_score: '低評価フィードバック受信時',
  pal_ad_budget_alert: '広告予算アラート',
  pal_video_complete: '動画レンダリング完了時',
  pal_ad_campaign_end: 'キャンペーン終了時',
  pal_studio_update: 'サイト更新関連',
  pal_base_activity: '販促ツール利用通知',
};

const SERVICE_LABELS: Record<string, string> = {
  pal_studio: 'Pal Studio', pal_base: 'Pal Base', pal_video: 'Pal Video',
  pal_opt: 'Pal Opt', pal_ad: 'Pal Ad', pal_trust: 'Pal Trust',
  palette_ai: 'Palette Ai', palette_console: 'Palette Console',
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const paletteId = String(params.id || '');

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [gasc, setGasc] = useState<GaScData>({ ga4PropertyId: '', ga4MeasurementId: '', scSiteUrl: '', hpUrl: '', notes: '' });
  const [line, setLine] = useState<LineData>({ lineUserId: '', notifyEnabled: true, notifyFrequency: 'realtime', notifyRules: Object.fromEntries(Object.keys(RULE_LABELS).map((k) => [k, true])) });
  const [googleConnected, setGoogleConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingGasc, setSavingGasc] = useState(false);
  const [savingLine, setSavingLine] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [custRes, gascRes, lineRes, authRes] = await Promise.all([
          fetch('/api/admin/customers'),
          fetch(`/api/admin/ga-settings?paletteId=${paletteId}`),
          fetch(`/api/admin/line-settings?paletteId=${paletteId}`),
          fetch('/api/google/auth?action=status'),
        ]);

        if (custRes.ok) {
          const data = await custRes.json();
          const c = (data.customers || []).find((x: Record<string, unknown>) => String(x.paletteId) === paletteId);
          if (c) setCustomer({ paletteId: c.paletteId, name: c.name, industry: c.industry, contactEmail: c.contactEmail, status: c.status, services: c.services || [] });
        }

        if (gascRes.ok) {
          const g = await gascRes.json();
          if (g) setGasc({ ga4PropertyId: g.ga4PropertyId || '', ga4MeasurementId: g.ga4MeasurementId || '', scSiteUrl: g.scSiteUrl || '', hpUrl: g.hpUrl || '', notes: g.notes || '' });
        }

        if (lineRes.ok) {
          const l = await lineRes.json();
          if (l) setLine({ lineUserId: l.lineUserId || '', notifyEnabled: l.notifyEnabled ?? true, notifyFrequency: l.notifyFrequency || 'realtime', notifyRules: l.notifyRules || Object.fromEntries(Object.keys(RULE_LABELS).map((k) => [k, true])) });
        }

        if (authRes.ok) {
          const a = await authRes.json();
          setGoogleConnected(a.connected);
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [paletteId]);

  const saveGasc = async () => {
    setSavingGasc(true);
    await fetch('/api/admin/ga-settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paletteId, ...gasc }),
    });
    setSavingGasc(false);
  };

  const saveLine = async () => {
    setSavingLine(true);
    await fetch('/api/admin/line-settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paletteId, ...line }),
    });
    setSavingLine(false);
  };

  const gaTag = gasc.ga4MeasurementId
    ? `<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=${gasc.ga4MeasurementId}"></script>\n<script>\nwindow.dataLayer = window.dataLayer || [];\nfunction gtag(){dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', '${gasc.ga4MeasurementId}');\n</script>`
    : '';

  const copyTag = () => {
    navigator.clipboard.writeText(gaTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded" style={{ background: 'var(--border-primary)' }} />
          <div className="h-64 rounded-lg" style={{ background: 'var(--border-primary)' }} />
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> 戻る
        </button>
        <div className="glass-card p-8 text-center">
          <p style={{ color: 'var(--text-muted)' }}>顧客が見つかりません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-sm mb-4 transition-colors hover:opacity-80" style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} /> 顧客一覧に戻る
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold" style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}>
          {paletteId.slice(0, 2)}
        </div>
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{customer.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{paletteId}</span>
            {customer.industry && <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}>{customer.industry}</span>}
            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--health-green-bg)', color: 'var(--health-green)' }}>{customer.status === 'active' ? 'アクティブ' : customer.status}</span>
          </div>
          <div className="flex gap-1 mt-2">
            {[...new Set(customer.services.map((s) => s.replace(/_(lite|standard|pro)$/i, '')))].map((s) => (
              <span key={s} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--border-primary)', color: 'var(--text-muted)' }}>{SERVICE_LABELS[s] || s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* HP URL */}
      <div className="glass-card p-5 mb-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Globe size={16} /> ホームページ
        </h3>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>HP URL</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={gasc.hpUrl}
              onChange={(e) => setGasc({ ...gasc, hpUrl: e.target.value })}
              className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
              placeholder="https://example.com"
            />
            {gasc.hpUrl && (
              <a href={gasc.hpUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 rounded-lg flex items-center" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)' }}>
                <ExternalLink size={16} style={{ color: 'var(--text-secondary)' }} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* GA / SC */}
      <div className="glass-card p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Activity size={16} /> Google Analytics / Search Console
          </h3>
          <div className="flex items-center gap-2">
            {googleConnected ? (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--health-green)' }}><Link2 size={12} /> Google連携済</span>
            ) : (
              <a href="/api/google/auth" className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: 'var(--health-red-bg)', color: 'var(--health-red)' }}>
                <Unlink size={12} /> 未連携
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#3B82F6' }}>GA4 プロパティID</label>
            <input
              type="text"
              value={gasc.ga4PropertyId}
              onChange={(e) => setGasc({ ...gasc, ga4PropertyId: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
              placeholder="例: 123456789"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>GA4管理画面 → プロパティ設定</p>
          </div>
          <div>
            <label className="block text-xs mb-1.5 font-medium" style={{ color: '#3B82F6' }}>GA4 測定ID</label>
            <input
              type="text"
              value={gasc.ga4MeasurementId}
              onChange={(e) => setGasc({ ...gasc, ga4MeasurementId: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
              placeholder="例: G-XXXXXXXXXX"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>データストリーム → 測定ID</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs mb-1.5 font-medium" style={{ color: '#EAB308' }}>Search Console サイトURL</label>
          <input
            type="text"
            value={gasc.scSiteUrl}
            onChange={(e) => setGasc({ ...gasc, scSiteUrl: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
            placeholder="例: https://example.com/ または sc-domain:example.com"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>メモ</label>
          <input
            type="text"
            value={gasc.notes}
            onChange={(e) => setGasc({ ...gasc, notes: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
            placeholder="任意のメモ"
          />
        </div>

        {/* GA Tag */}
        {gasc.ga4MeasurementId && (
          <div className="p-4 rounded-lg mb-4" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-primary)' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>お客さんに設置してもらうGAタグ</p>
              <button onClick={copyTag} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
                {copied ? <Check size={12} style={{ color: 'var(--health-green)' }} /> : <Copy size={12} />}
                {copied ? 'コピー済' : 'コピー'}
              </button>
            </div>
            <pre className="text-xs p-3 rounded overflow-x-auto whitespace-pre-wrap" style={{ background: 'var(--bg-primary)', color: 'var(--text-muted)' }}>{gaTag}</pre>
          </div>
        )}

        <button
          onClick={saveGasc}
          disabled={savingGasc}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: savingGasc ? 'var(--border-primary)' : 'var(--text-primary)', color: savingGasc ? 'var(--text-muted)' : 'var(--bg-primary)' }}
        >
          <Save size={14} /> {savingGasc ? '保存中...' : 'HP・GA・SC設定を保存'}
        </button>
      </div>

      {/* LINE Notification */}
      <div className="glass-card p-5 mb-4">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Bell size={16} /> LINE通知設定
        </h3>

        <div className="mb-4">
          <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>LINE User ID</label>
          <input
            type="text"
            value={line.lineUserId}
            onChange={(e) => setLine({ ...line, lineUserId: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
            placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => setLine({ ...line, notifyEnabled: !line.notifyEnabled })}
            className="w-10 h-5 rounded-full transition-colors relative"
            style={{ background: line.notifyEnabled ? 'var(--health-green)' : 'var(--border-primary)' }}
          >
            <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all" style={{ left: line.notifyEnabled ? '22px' : '2px' }} />
          </button>
          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>通知 {line.notifyEnabled ? 'ON' : 'OFF'}</span>
        </div>

        <div className="mb-4">
          <label className="block text-xs mb-2" style={{ color: 'var(--text-muted)' }}>通知頻度</label>
          <div className="flex gap-2">
            {[{ v: 'realtime', l: 'リアルタイム' }, { v: 'daily', l: '1日1回' }, { v: 'weekly', l: '週1回' }].map((o) => (
              <button key={o.v} onClick={() => setLine({ ...line, notifyFrequency: o.v })}
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  background: line.notifyFrequency === o.v ? 'var(--bg-card-hover)' : 'var(--bg-input)',
                  border: `1px solid ${line.notifyFrequency === o.v ? 'var(--text-primary)' : 'var(--border-primary)'}`,
                  color: 'var(--text-primary)',
                }}
              >{o.l}</button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs mb-2" style={{ color: 'var(--text-muted)' }}>通知ルール</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {Object.entries(RULE_LABELS).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 p-2 rounded-lg cursor-pointer" style={{ background: 'var(--bg-input)' }}>
                <input type="checkbox" checked={line.notifyRules[key] !== false}
                  onChange={(e) => setLine({ ...line, notifyRules: { ...line.notifyRules, [key]: e.target.checked } })}
                  className="w-3.5 h-3.5 rounded accent-white"
                />
                <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={saveLine}
          disabled={savingLine}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: savingLine ? 'var(--border-primary)' : 'var(--text-primary)', color: savingLine ? 'var(--text-muted)' : 'var(--bg-primary)' }}
        >
          <Save size={14} /> {savingLine ? '保存中...' : 'LINE設定を保存'}
        </button>
      </div>
    </div>
  );
}
