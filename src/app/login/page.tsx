'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ResponsiveImage from '@/components/ui/ResponsiveImage';
import { useUser } from '@/context/UserContext';
import { useLanguage } from '@/context/LanguageContext';

export default function LoginPage() {
  const router = useRouter();
  const { login, signUp, signInWithGoogle, resendConfirmation, loading } = useUser();
  const { t, language, setLanguage } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [user_type, setUserType] = useState<'farmer' | 'buyer'>('farmer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    // Security: Clear stale data from previous sessions before starting new auth
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('agritech_') || key.startsWith('shipments_')) {
          localStorage.removeItem(key);
        }
      });
    }

    if (isLogin) {
      const { error: loginError } = await login(email, password);
      if (loginError) {
        if (loginError.toLowerCase().includes('email not confirmed')) {
          setError('Please check your email to confirm your account before logging in.');
        } else if (loginError.toLowerCase().includes('invalid login credentials')) {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(loginError);
        }
      } else {
        router.push('/');
      }
    } else {
      const { error: signUpError } = await signUp(email, password, name, user_type);
      if (signUpError) {
        setError(signUpError);
      } else {
        setIsLogin(true);
        setSuccess('Account created! Please check your email to confirm your account, then log in.');
      }
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setError(null);
    const { error: resendError } = await resendConfirmation(email);
    if (resendError) {
      setError(resendError);
    } else {
      setSuccess('Confirmation email resent! Please check your inbox.');
    }
  };

  return (
    <main className="min-h-screen relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden font-sans">
      {/* Cinematic Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
      </div>

      <div className="w-full max-w-5xl relative z-10 flex flex-col md:flex-row bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl shadow-black/50 overflow-hidden">
        {/* Left Side: Brand & Vibe */}
        <div className="md:w-1/2 p-8 sm:p-16 text-white flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-white/5">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-green-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/30 rotate-6">
                <span className="material-symbols-outlined text-2xl font-bold">eco</span>
              </div>
              <h1 className="font-black text-2xl tracking-tighter uppercase italic">Agri<span className="text-primary italic">Tech</span></h1>
            </div>
            
            <h2 className="text-4xl sm:text-6xl font-black tracking-tighter leading-[0.9] mb-8 uppercase italic">
              Empowering the <br />
              <span className="text-primary italic">Next Generation</span> <br />
              of Farmers.
            </h2>
            
            <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-sm leading-snug">
              Bridging the gap between traditional wisdom and modern technology.
            </p>
          </div>

          <div className="relative z-10 pt-12">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <img
                    key={i}
                    src={`https://picsum.photos/seed/farmer${i}/40/40`}
                    className="w-10 h-10 rounded-full border-4 border-slate-900 shadow-xl"
                    alt="User"
                  />
                ))}
              </div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Join 12k+ Innovators</p>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="md:w-1/2 p-8 sm:p-16 flex flex-col justify-center bg-slate-900/40">
          <div className="max-w-sm mx-auto w-full space-y-8">
            <div className="space-y-2">
              <h3 className="text-3xl font-black tracking-tight text-white uppercase italic">{isLogin ? 'Welcome Back' : 'Create Identity'}</h3>
              <p className="text-sm text-slate-400 font-medium">
                {isLogin ? "Don't have an account?" : "Already a member?"}{' '}
                <button 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-primary font-black hover:underline ml-1"
                >
                  {isLogin ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>

            {!isLogin && (
              <div className="grid grid-cols-2 gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setUserType('farmer')}
                  className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    user_type === 'farmer' 
                      ? 'bg-primary text-white shadow-lg' 
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Farmer
                </button>
                <button
                  type="button"
                  onClick={() => setUserType('buyer')}
                  className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    user_type === 'buyer' 
                      ? 'bg-primary text-white shadow-lg' 
                      : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Buyer
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-[10px] font-black uppercase tracking-widest">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-[10px] font-black uppercase tracking-widest">
                  {success}
                </div>
              )}

              <div className="space-y-6">
                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@nexus.com"
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
              >
                {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
              </button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest"><span className="bg-slate-900/50 px-4 text-slate-500">Or continue with</span></div>
            </div>

            <button 
              onClick={async () => {
                setError(null);
                const { error } = await signInWithGoogle();
                if (error) setError(error);
              }}
              className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              <span className="uppercase tracking-widest text-[10px] font-black">Google Identity</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
