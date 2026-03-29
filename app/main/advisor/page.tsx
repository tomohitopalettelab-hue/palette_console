'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, AlertCircle, AlertTriangle, CheckCircle, RefreshCw, ArrowRight } from 'lucide-react';

type Action = {
  priority: 'high' | 'medium' | 'low';
  service: string;
  title: string;
  description: string;
  actionLabel: string;
};

type AdvisorData = {
  actions: Action[];
  summary: string;
};

const SERVICE_LABELS: Record<string, string> = {
  pal_studio: 'Web制作',
  pal_base: '販促ツール',
  pal_video: '動画制作',
  pal_opt: 'マーケティング',
  pal_ad: '広告運用',
  pal_trust: '顧客評価',
};

const PRIORITY_CONFIG = {
  high: { icon: AlertCircle, color: 'var(--health-red)', bg: 'var(--health-red-bg)', label: '優先度：高' },
  medium: { icon: AlertTriangle, color: 'var(--health-yellow)', bg: 'var(--health-yellow-bg)', label: '優先度：中' },
  low: { icon: CheckCircle, color: 'var(--health-green)', bg: 'var(--health-green-bg)', label: '好調' },
};

export default function AdvisorPage() {
  const router = useRouter();
  const [data, setData] = useState<AdvisorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigateToService = (serviceKey: string) => {
    router.push(`/main/services?open=${serviceKey}`);
  };

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/console/ai-advisor');
      if (res.ok) {
        setData(await res.json());
      } else {
        setError('分析データの取得に失敗しました');
      }
    } catch {
      setError('通信エラーが発生しました');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const groupedActions = data?.actions.reduce((acc, action) => {
    if (!acc[action.priority]) acc[action.priority] = [];
    acc[action.priority].push(action);
    return acc;
  }, {} as Record<string, Action[]>) || {};

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Sparkles size={20} /> AIアドバイザー
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>全データをAIが分析し、次のアクションを提案します</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
          style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          再分析
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--text-primary)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>AIがデータを分析中...</p>
          </div>
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center">
          <p style={{ color: 'var(--health-red)' }}>{error}</p>
        </div>
      ) : data ? (
        <>
          {/* Summary */}
          {data.summary && (
            <div className="glass-card p-5 mb-6">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{data.summary}</p>
            </div>
          )}

          {/* Actions grouped by priority */}
          <div className="space-y-6">
            {(['high', 'medium', 'low'] as const).map((priority) => {
              const actions = groupedActions[priority];
              if (!actions?.length) return null;
              const config = PRIORITY_CONFIG[priority];
              const PriorityIcon = config.icon;

              return (
                <div key={priority}>
                  <div className="flex items-center gap-2 mb-3">
                    <PriorityIcon size={16} style={{ color: config.color }} />
                    <span className="text-sm font-semibold" style={{ color: config.color }}>{config.label}</span>
                  </div>
                  <div className="space-y-2">
                    {actions.map((action, i) => (
                      <div
                        key={i}
                        className="glass-card p-4 flex items-center justify-between"
                        style={{ borderLeftWidth: '3px', borderLeftColor: config.color }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
                              {SERVICE_LABELS[action.service] || action.service}
                            </span>
                          </div>
                          <h4 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{action.title}</h4>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{action.description}</p>
                        </div>
                        <button
                          onClick={() => navigateToService(action.service)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ml-4 whitespace-nowrap cursor-pointer hover:opacity-80"
                          style={{ background: config.bg, color: config.color }}
                        >
                          {action.actionLabel}
                          <ArrowRight size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
