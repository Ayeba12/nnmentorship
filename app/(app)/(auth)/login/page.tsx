"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import supabase from '@/lib/supabase';
import { signInWithGoogle } from '@/lib/googleAuth';
import { Button } from '@/components/ui';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams ? searchParams.get('redirect') : null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const lowerEmail = email.toLowerCase().trim();
    const isMockFormat = lowerEmail.endsWith('@navymentor.ng') || 
                         lowerEmail.endsWith('@navy.mil.ng') || 
                         lowerEmail.endsWith('@retired.navy.mil.ng');
    const isDemoPassword = password === 'password123';

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: lowerEmail, password });
      
      if (error) {
        const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
        if (!isProduction && isMockFormat && isDemoPassword) {
          localStorage.setItem('mock_session', JSON.stringify({
            access_token: `mock-token-${lowerEmail}`,
            user: { email: lowerEmail, id: `mock-uuid-${lowerEmail}` }
          }));
          window.location.href = redirect || '/dashboard';
          return;
        }
        throw error;
      }

      if (data?.session) {
        if (data.session.access_token?.startsWith('mock-token-')) {
          localStorage.setItem('mock_session', JSON.stringify(data.session));
        }
      } else {
        const isProduction = typeof window !== 'undefined' && !window.location.hostname.includes('localhost');
        if (!isProduction && isMockFormat && isDemoPassword) {
          localStorage.setItem('mock_session', JSON.stringify({
            access_token: `mock-token-${lowerEmail}`,
            user: { email: lowerEmail, id: `mock-uuid-${lowerEmail}` }
          }));
        }
      }

      window.location.href = redirect || '/dashboard';
    } catch (err: any) {
      const isNetworkError = err.message?.includes('Failed to fetch') || err.message?.includes('network');
      if (isNetworkError && isMockFormat && isDemoPassword) {
        localStorage.setItem('mock_session', JSON.stringify({
          access_token: `mock-token-${lowerEmail}`,
          user: { email: lowerEmail, id: `mock-uuid-${lowerEmail}` }
        }));
        window.location.href = redirect || '/dashboard';
        return;
      }
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-navy-50">
      {/* Left Panel — Branding */}
      <div 
        className="hidden lg:flex lg:w-2/5 relative overflow-hidden flex-col justify-between p-12 text-white"
        style={{
          backgroundImage: "url('/assets/login-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay to ensure text contrast */}
        <div className="absolute inset-0 bg-navy-950/80 z-0" />
        
        <div className="absolute top-0 right-0 w-72 h-72 bg-navy-600/40 rounded-full blur-3xl z-0" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-gold-500/5 rounded-full blur-3xl z-0" />

        <Link href="/" className="relative z-10 flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <img
            src="/assets/nigerian-navy-logo.png"
            alt="Nigerian Navy Logo"
            className="w-9 h-9 object-contain"
          />
          <div>
            <div className="text-white font-bold text-sm tracking-tight">Nigerian Navy</div>
            <p className="text-navy-300 text-[11px]">Mentorship Platform</p>
          </div>
        </Link>

        <div className="relative z-10 max-w-sm">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-3xl font-bold text-white leading-tight tracking-tight"
          >
            Connect. Learn. Grow together.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-navy-300 text-sm mt-4 leading-relaxed"
          >
            The official mentorship platform connecting serving officers and veterans with the next generation of naval leaders.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-8 flex items-center gap-6"
          >
            <div>
              <p className="text-2xl font-bold text-white">500+</p>
              <p className="text-xs text-navy-400">Mentors</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-2xl font-bold text-white">1,200+</p>
              <p className="text-xs text-navy-400">Mentees</p>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div>
              <p className="text-2xl font-bold text-white">5,000+</p>
              <p className="text-xs text-navy-400">Sessions</p>
            </div>
          </motion.div>
        </div>

        <p className="relative z-10 text-navy-400 text-xs">© 2026 Nigerian Navy. All rights reserved.</p>
      </div>

      {/* Right Panel — Form */}
      <div className="w-full lg:w-3/5 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2.5 mb-8 hover:opacity-90 transition-opacity">
            <img
              src="/assets/nigerian-navy-logo.png"
              alt="Nigerian Navy Logo"
              className="w-9 h-9 object-contain"
            />
            <div>
              <div className="text-navy-800 font-bold text-sm tracking-tight">Nigerian Navy</div>
              <p className="text-navy-400 text-[11px]">Mentorship Platform</p>
            </div>
          </Link>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <h1 className="text-xl font-bold text-navy-800 tracking-tight">Welcome back</h1>
            <p className="text-sm text-navy-400 mt-1">Sign in to your account to continue</p>
          </motion.div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 bg-red-50 border border-red-100 rounded-md text-sm text-red-600">
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-navy-600 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md border border-navy-200 bg-white text-navy-900 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-400 focus:border-navy-400 transition-all"
                placeholder="you@navy.mil.ng"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-medium text-navy-600">Password</label>
                <Link href="/forgot-password" className="text-xs font-semibold text-navy-500 hover:text-navy-700 transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-3 pr-10 py-2.5 rounded-md border border-navy-200 bg-white text-navy-900 text-sm placeholder:text-navy-300 focus:outline-none focus:ring-1 focus:ring-navy-400 focus:border-navy-400 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-navy-400 hover:text-navy-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign In <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <div className="flex-1 h-px bg-navy-100" />
            <span className="text-xs text-navy-300">or</span>
            <div className="flex-1 h-px bg-navy-100" />
          </div>

          <Button variant="outline" className="w-full" size="lg" onClick={() => signInWithGoogle()}>
            <svg className="w-4 h-4 mr-2 inline" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </Button>

          <p className="mt-5 text-center text-sm text-navy-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-navy-700 font-medium hover:text-navy-900 transition-colors">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-navy-50">
        <div className="text-navy-700 font-medium">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
