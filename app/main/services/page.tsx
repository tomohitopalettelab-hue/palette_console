'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, Globe, Film, PenTool, Megaphone, Star, Palette } from 'lucide-react';

type ServiceInfo = {
  key: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  baseUrl: string;
};

const ALL_SERVICES: ServiceInfo[] = [
  { key: 'pal_studio', label: 'Pal Studio', description: 'Web制作', icon: Globe, color: '#3B82F6', bgColor: 'rgba(59,130,246,0.1)', baseUrl: 'https://pal-studio.vercel.app' },
  { key: 'pal_base', label: 'Pal Base', description: '販促ツール', icon: Palette, color: '#8CC63F', bgColor: 'rgba(140,198,63,0.1)', baseUrl: 'https://pal-base.vercel.app' },
  { key: 'pal_video', label: 'Pal Video', description: '動画制作', icon: Film, color: '#F97316', bgColor: 'rgba(249,115,22,0.1)', baseUrl: 'https://pal-video.vercel.app' },
  { key: 'pal_opt', label: 'Pal Opt', description: 'マーケティング', icon: PenTool, color: '#A855F7', bgColor: 'rgba(168,85,247,0.1)', baseUrl: 'https://pal-opt.vercel.app' },
  { key: 'pal_ad', label: 'Pal Ad', description: '広告運用', icon: Megaphone, color: '#EF4444', bgColor: 'rgba(239,68,68,0.1)', baseUrl: 'https://pal-ad.vercel.app' },
  { key: 'pal_trust', label: 'Pal Trust', description: '顧客評価', icon: Star, color: '#EAB308', bgColor: 'rgba(234,179,8,0.1)', baseUrl: 'https://www.pal-trust.com' },
];

function ServicesContent() {
  const searchParams = useSearchParams();
  const [subscribedServices, setSubscribedServices] = useState<string[]>([]);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [ssoToken, setSsoToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/console/dashboard').then(r => r.json()),
      fetch('/api/console/sso-token').then(r => r.json()),
    ]).then(([dashData, ssoData]) => {
      if (dashData.subscribedServices) setSubscribedServices(dashData.subscribedServices);
      if (ssoData.token) setSsoToken(ssoData.token);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Handle ?open=service_key from AI advisor
  useEffect(() => {
    if (loading || !ssoToken) return;
    const openKey = searchParams.get('open');
    if (openKey && subscribedServices.includes(openKey)) {
      openService(openKey);
    }
  }, [loading, ssoToken, searchParams, subscribedServices]);

  const openService = (key: string) => {
    if (!openTabs.includes(key)) {
      setOpenTabs(prev => [...prev, key]);
    }
    setActiveTab(key);
  };

  const closeTab = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t !== key);
    setOpenTabs(newTabs);
    if (activeTab === key) {
      setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
    }
  };

  const getServiceInfo = (key: string) => ALL_SERVICES.find(s => s.key === key);

  const buildIframeUrl = (svc: ServiceInfo) =>
    `${svc.baseUrl}/api/console-sso?token=${encodeURIComponent(ssoToken)}&redirect=/main`;

  const availableServices = ALL_SERVICES.filter(s => subscribedServices.includes(s.key));

  return (
    <div className="h-full flex flex-col">
      {/* Tab Bar */}
      <div className="flex items-center border-b overflow-x-auto no-scrollbar" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <button
          onClick={() => setActiveTab(null)}
          className="px-4 py-3 text-sm whitespace-nowrap transition-colors"
          style={{
            background: activeTab === null ? 'var(--bg-primary)' : 'transparent',
            color: activeTab === null ? 'var(--text-primary)' : 'var(--text-muted)',
            borderBottom: activeTab === null ? '2px solid var(--text-primary)' : '2px solid transparent',
          }}
        >
          サービス一覧
        </button>
        {openTabs.map(key => {
          const svc = getServiceInfo(key);
          if (!svc) return null;
          const Icon = svc.icon;
          return (
            <div
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap cursor-pointer transition-colors"
              style={{
                background: activeTab === key ? 'var(--bg-primary)' : 'transparent',
                color: activeTab === key ? svc.color : 'var(--text-muted)',
                borderBottom: activeTab === key ? `2px solid ${svc.color}` : '2px solid transparent',
              }}
            >
              <Icon size={14} style={{ color: svc.color }} />
              {svc.label}
              <button onClick={e => closeTab(key, e)} className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors">
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {activeTab === null ? (
          <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>サービス管理</h2>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>契約中のサービスの管理画面にアクセスできます（ログイン不要）</p>

            {loading ? (
              <div className="glass-card p-12 text-center">
                <div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--text-primary)' }} />
              </div>
            ) : availableServices.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <p style={{ color: 'var(--text-muted)' }}>契約中のサービスがありません</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableServices.map(svc => {
                  const Icon = svc.icon;
                  const isOpen = openTabs.includes(svc.key);
                  return (
                    <button
                      key={svc.key}
                      onClick={() => openService(svc.key)}
                      className="glass-card p-5 text-left group hover:opacity-90 transition-all"
                      style={{ borderLeft: `3px solid ${svc.color}` }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: svc.bgColor }}>
                          <Icon size={20} style={{ color: svc.color }} />
                        </div>
                        <h3 className="text-sm font-bold" style={{ color: svc.color }}>{svc.label}</h3>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{svc.description}</p>
                      {isOpen && <p className="text-xs mt-2" style={{ color: svc.color }}>タブで開いています</p>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Render all open iframes, show/hide based on activeTab */
          openTabs.map(key => {
            const svc = getServiceInfo(key);
            if (!svc) return null;
            return (
              <iframe
                key={key}
                src={buildIframeUrl(svc)}
                className="w-full h-full border-0 absolute inset-0"
                style={{
                  minHeight: 'calc(100vh - 110px)',
                  display: activeTab === key ? 'block' : 'none',
                }}
                title={svc.label}
                allow="clipboard-write"
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="p-6"><div className="w-8 h-8 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--text-primary)' }} /></div>}>
      <ServicesContent />
    </Suspense>
  );
}
