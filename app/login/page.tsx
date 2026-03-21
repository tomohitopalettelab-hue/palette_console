'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'customer' | 'admin'>('customer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'ログインに失敗しました');
        return;
      }
      router.push(data.role === 'admin' ? '/admin' : '/main');
    } catch {
      setError('通信エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold tracking-wider" style={{ color: 'var(--text-primary)' }}>
            PALETTE<span className="font-light ml-2">CONSOLE</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>サービス統合ダッシュボード</p>
        </div>

        <div className="glass-card p-8">
          <div className="flex mb-6 rounded-lg overflow-hidden" style={{ background: 'var(--bg-input)' }}>
            <button
              onClick={() => setMode('customer')}
              className="flex-1 py-2.5 text-sm font-medium transition-colors"
              style={{
                background: mode === 'customer' ? 'var(--border-hover)' : 'transparent',
                color: mode === 'customer' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              お客様ログイン
            </button>
            <button
              onClick={() => setMode('admin')}
              className="flex-1 py-2.5 text-sm font-medium transition-colors"
              style={{
                background: mode === 'admin' ? 'var(--border-hover)' : 'transparent',
                color: mode === 'admin' ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              管理者ログイン
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>ログインID</label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                placeholder="ID を入力"
                required
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none transition-colors"
                style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', border: '1px solid var(--border-primary)' }}
                placeholder="パスワードを入力"
                required
              />
            </div>

            {error && <p className="text-sm" style={{ color: 'var(--health-red)' }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-medium transition-all"
              style={{
                background: loading ? 'var(--border-primary)' : 'var(--text-primary)',
                color: loading ? 'var(--text-muted)' : 'var(--bg-primary)',
              }}
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
