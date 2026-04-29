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
  const [role, setRole] = useState<'farmer' | 'buyer'>('farmer');
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
      const { error: signUpError } = await signUp(email, password, name, role);
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
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex items-center justify-center p-4 sm:p-8 transition-colors duration-300">
      <div className="max-w-5xl w-full bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-slate-100 dark:border-slate-800 transition-colors">
        <div className="md:w-1/2 bg-background-dark p-8 sm:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8 sm:mb-12">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white">
                  <span className="material-symbols-outlined fill-1">potted_plant</span>
                </div>
                <h1 className="font-bold text-xl tracking-tight">AgriTech Pro</h1>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => setLanguage('en')}
                  className={`text-[10px] font-black px-2 py-1 rounded-md transition-all ${language === 'en' ? 'bg-primary text-white' : 'text-slate-500 hover:text-white'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLanguage('fr')}
                  className={`text-[10px] font-black px-2 py-1 rounded-md transition-all ${language === 'fr' ? 'bg-primary text-white' : 'text-slate-500 hover:text-white'}`}
                >
                  FR
                </button>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter leading-none mb-4 sm:mb-6">
              {language === 'en' ? (
                <>Empowering the <span className="text-primary italic">Next Generation</span> of Cameroonian Farmers 🇨🇲.</>
              ) : (
                <>Autonomiser la <span className="text-primary italic">nouvelle génération</span> d&apos;agriculteurs camerounais 🇨🇲.</>
              )}
            </h2>
            <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
              {t('hero_desc')}
            </p>
          </div>

          <div className="relative z-10 pt-8 sm:pt-12 border-t border-white/10 mt-8 sm:mt-0">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <ResponsiveImage
                    key={i}
                    src={`https://picsum.photos/seed/user${i}/40/40`}
                    className="w-8 h-8 rounded-full border-2 border-background-dark"
                    alt={`Avatar of active farmer ${i}`}
                    baseWidth={40}
                    baseHeight={40}
                  />
                ))}
              </div>
              <p className="text-xs sm:text-sm font-bold text-slate-400">Trusted by 12,000+ farmers</p>
            </div>
          </div>
        </div>

        <div className="md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full space-y-6 sm:space-y-8">
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight dark:text-white">{isLogin ? t('welcome_back') : t('create_account')}</h3>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 transition-colors">
                {isLogin ? t('no_account') : t('have_account')}{' '}
                <button 
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-primary font-bold hover:underline"
                >
                  {isLogin ? t('sign_up') : t('log_in')}
                </button>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-xs font-bold">
                  <div className="flex flex-col gap-2">
                    <p>{error}</p>
                    {error.includes('confirm your account') && (
                      <button 
                        type="button"
                        onClick={handleResendEmail}
                        className="text-primary hover:underline text-left"
                      >
                        Resend confirmation email?
                      </button>
                    )}
                  </div>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-2xl text-green-600 dark:text-green-400 text-xs font-bold">
                  {success}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setRole('farmer')}
                  className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    role === 'farmer' 
                      ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {t('farmer')}
                </button>
                <button
                  type="button"
                  onClick={() => setRole('buyer')}
                  className={`py-2 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    role === 'buyer' 
                      ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {t('buyer')}
                </button>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('full_name')}</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none dark:text-white transition-colors"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('email_address')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none dark:text-white transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('password')}</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-6 py-3 sm:py-4 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none dark:text-white transition-colors"
                />
              </div>
              {isLogin && (
                <div className="text-right">
                  <Link href="/forgot-password" title="Reset your password" className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">{t('forgot_password')}</Link>
                </div>
              )}
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-3 sm:py-4 rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : (isLogin ? t('log_in') : t('sign_up'))}
              </button>
            </form>

            <div className="relative py-2 sm:py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100 dark:border-slate-800 transition-colors"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                <span className="bg-white dark:bg-slate-900 px-4 transition-colors">{t('or_continue_with')}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-4">
              <button 
                onClick={async () => {
                  setError(null);
                  const { error } = await signInWithGoogle();
                  if (error) setError(error);
                }}
                className="flex items-center justify-center gap-3 py-3 sm:py-4 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
              >
                <ResponsiveImage 
                  src="https://www.google.com/favicon.ico" 
                  alt="Google logo" 
                  className="w-5 h-5" 
                  baseWidth={16}
                  baseHeight={16}
                />
                <span className="text-sm font-black uppercase tracking-widest dark:text-white transition-colors">Continue with Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
