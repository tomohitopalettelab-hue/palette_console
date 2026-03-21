'use client';

import { useEffect, useState } from 'react';
import { X, ExternalLink, Globe, Film, PenTool, Megaphone, Star, Palette } from 'lucide-react';

type Session = { paletteId: string };
type ServiceTab = {
  key: string;
  label: string;
  icon: React.ElementType;
  url: string;
};

const ALL_SERVICES: Omit<ServiceTab, 'url'>[] = [
  { key: 'pal_studio', label: 'Web制作', icon: Globe },
  { key: 'pal_base', label: '販促ツール', icon: Palette },
  { key: 'pal_video', label: '動画制作', icon: Film },
  { key: 'pal_opt', label: 'マーケティング', icon: PenTool },
  { key: 'pal_ad', label: '広告運用', icon: Megaphone },
  { key: 'pal_trust', label: '顧客評価', icon: Star },
];

const SERVICE_URLS: Record<string, string> = {
  pal_studio: 'http://localhost:3000/main',
  pal_base: 'http://localhost:3105/main',
  pal_video: 'http://localhost:3103/main',
  pal_opt: 'http://localhost:3104/main',
  pal_ad: 'http://localhost:3105/main',
  pal_trust: 'http://localhost:3000/main',
};

export default function ServicesPage() {
  const [subscribedServices, setSubscribedServices] = useState<string[]>([]);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) setSession({ paletteId: data.paletteId });
      });

    fetch('/api/console/dashboard')
      .then((r) => r.json())
      .then((data) => {
        if (data.subscribedServices) setSubscribedServices(data.subscribedServices);
      })
      .catch(() => {});
  }, []);

  const openService = (key: string) => {
    if (!openTabs.includes(key)) {
      setOpenTabs([...openTabs, key]);
    }
    setActiveTab(key);
  };

  const closeTab = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter((t) => t !== key);
    setOpenTabs(newTabs);
    if (activeTab === key) {
      setActiveTab(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
    }
  };

  const availableServices = ALL_SERVICES.filter((s) => subscribedServices.includes(s.key));

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
        {openTabs.map((key) => {
          const svc = ALL_SERVICES.find((s) => s.key === key);
          if (!svc) return null;
          const Icon = svc.icon;
          return (
            <div
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap cursor-pointer transition-colors"
              style={{
                background: activeTab === key ? 'var(--bg-primary)' : 'transparent',
                color: activeTab === key ? 'var(--text-primary)' : 'var(--text-muted)',
                borderBottom: activeTab === key ? '2px solid var(--text-primary)' : '2px solid transparent',
              }}
            >
              <Icon size={14} />
              {svc.label}
              <button
                onClick={(e) => closeTab(key, e)}
                className="ml-1 p-0.5 rounded hover:bg-white/10 transition-colors"
              >
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
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>契約中のサービスの管理画面にアクセスできます</p>

            {availableServices.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <p style={{ color: 'var(--text-muted)' }}>契約中のサービスがありません</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableServices.map((svc) => {
                  const Icon = svc.icon;
                  const isOpen = openTabs.includes(svc.key);
                  return (
                    <button
                      key={svc.key}
                      onClick={() => openService(svc.key)}
                      className="glass-card p-5 text-left flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--bg-input)' }}>
                          <Icon size={20} style={{ color: 'var(--text-secondary)' }} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{svc.label}</h3>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {isOpen ? 'タブで開いています' : '管理画面を開く'}
                          </p>
                        </div>
                      </div>
                      <ExternalLink size={16} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // iframe for active service
          <iframe
            key={activeTab}
            src={SERVICE_URLS[activeTab] || ''}
            className="w-full h-full border-0"
            style={{ minHeight: 'calc(100vh - 110px)' }}
            title={activeTab}
          />
        )}
      </div>
    </div>
  );
}
