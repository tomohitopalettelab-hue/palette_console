'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Users, Bell, BarChart3, LogOut, Activity } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: '顧客一覧', icon: Users },
  { href: '/admin/ga-settings', label: 'GA/SC設定', icon: Activity },
  { href: '/admin/line-settings', label: 'LINE通知設定', icon: Bell },
  { href: '/admin/analytics', label: '全体分析', icon: BarChart3 },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/api/auth/session')
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated || data.role !== 'admin') {
          router.replace('/admin-login');
        } else {
          setAuthenticated(true);
        }
      })
      .catch(() => router.replace('/admin-login'));
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin-login');
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-primary)', borderTopColor: 'var(--text-primary)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      <aside className="w-60 flex-shrink-0 flex flex-col border-r" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="p-5 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <h1 className="text-lg font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>
            PALETTE<span className="font-light ml-1">CONSOLE</span>
          </h1>
          <p className="text-xs mt-1 px-2 py-0.5 rounded inline-block" style={{ background: 'var(--health-red-bg)', color: 'var(--health-red)' }}>Admin</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all text-left"
                style={{
                  background: isActive ? 'var(--bg-card-hover)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left"
            style={{ color: 'var(--text-muted)' }}
          >
            <LogOut size={18} />
            ログアウト
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {children}
      </main>
    </div>
  );
}
