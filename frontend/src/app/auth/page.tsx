'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/utils/api';
import { Sparkles, AlertCircle } from 'lucide-react';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Toggle modes: login or signup
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup') {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const data = await apiFetch('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        localStorage.setItem('ssp_token', data.token);
        localStorage.setItem('ssp_user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        const data = await apiFetch('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, name, username }),
        });
        localStorage.setItem('ssp_token', data.token);
        localStorage.setItem('ssp_user', JSON.stringify(data.user));
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 glass rounded-2xl border border-zinc-800 shadow-2xl relative">
      <div className="text-center space-y-2 mb-8">
        <Link href="/" className="inline-flex items-center gap-1.5 font-black text-xl tracking-tight text-white mb-2">
          <div className="w-6 h-6 rounded bg-indigo-600 flex items-center justify-center text-white font-black text-sm">S</div>
          <span>SSP CodeBase</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          {isLogin ? 'Welcome back' : 'Create an account'}
        </h2>
        <p className="text-sm text-zinc-400">
          {isLogin ? "Enter your details to access your dashboard" : "Join today to start practice and competitive contests"}
        </p>
      </div>

      {error && (
        <div className="p-3 mb-6 rounded-xl bg-red-950/50 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-4 py-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 hover:shadow-indigo-600/20 active:translate-y-[1px] transition-all font-bold rounded-xl text-white shadow-lg text-sm mt-4 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
            </>
          )}
        </button>
      </form>

      <div className="text-center mt-6">
        <button
          type="button"
          onClick={() => {
            setError('');
            setIsLogin(!isLogin);
          }}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

      <Suspense fallback={
        <div className="w-full max-w-md p-8 glass rounded-2xl flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      }>
        <AuthContent />
      </Suspense>
    </div>
  );
}
