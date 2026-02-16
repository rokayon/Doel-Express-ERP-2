
import React, { useState } from 'react';
import { Language, translations } from '../translations';
import Logo from './Logo';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: string, password?: string) => boolean;
  onSignUp: (username: string, email: string, password?: string) => void;
  language: Language;
  onLanguageToggle: () => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  siteName: string;
  siteLogo: string;
}

type ViewState = 'signIn' | 'signUp' | 'forgotPassword';

const Login: React.FC<LoginProps> = ({ 
  onLogin, 
  onSignUp, 
  language, 
  onLanguageToggle, 
  isDarkMode, 
  onThemeToggle,
  siteName,
  siteLogo
}) => {
  const [view, setView] = useState<ViewState>('signIn');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const t = translations[language];

  // Official Background
  const busPhotoUrl = "https://files.oaiusercontent.com/file-P9L7H5S3K2J1M0N9B8V7C6X5?se=2025-02-21T11%3A54%3A46Z&sp=r&sv=2024-08-04&sr=b&rscc=max-age%3D604800%2C%20immutable%2C%20private&rscd=attachment%3B%20filename%3D0f39385b-064e-4127-9957-c817290f6e9c.webp&sig=v2jD8p6O4n6M8p0P2q4R6s8T0u2V4w6X8y0Z2%3D";

  const nameParts = siteName.split(' ');
  const firstPart = nameParts[0];
  const restPart = nameParts.slice(1).join(' ');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (view === 'signIn') {
      const success = onLogin(username, password);
      if (!success) {
        setError(t.invalidCredentials);
      }
    } else if (view === 'signUp') {
      if (password !== confirmPassword) {
        setError(language === 'en' ? "Passwords don't match" : "পাসওয়ার্ড মিলছে না");
        return;
      }
      onSignUp(username, email, password);
      setSuccess(t.accountCreated);
      setTimeout(() => {
        setView('signIn');
        setUsername('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }, 4000);
    } else if (view === 'forgotPassword') {
      setSuccess(t.resetEmailSent);
      setTimeout(() => setView('signIn'), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-500 relative overflow-hidden">
      {/* Dynamic Immersive Background */}
      <div 
        className="fixed inset-0 z-0 scale-105"
        style={{
          backgroundImage: `url(${busPhotoUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.6) blur(2px)'
        }}
      />
      
      {/* Dark Overlay with Gradient */}
      <div className="fixed inset-0 z-0 bg-gradient-to-tr from-slate-950/80 via-transparent to-slate-950/40" />

      {/* Glassmorphism Blurs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-1">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-end gap-3 mb-6">
          <button 
            onClick={onLanguageToggle}
            className="px-4 py-2 rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 text-white text-xs font-bold transition-all hover:bg-blue-600 hover:text-white shadow-xl"
          >
            <i className="fa-solid fa-globe mr-2"></i>
            {language === 'en' ? 'বাংলা' : 'English'}
          </button>
          <button 
            onClick={onThemeToggle}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 dark:bg-black/20 backdrop-blur-xl border border-white/20 text-white transition-all hover:bg-blue-600 hover:text-white shadow-xl"
          >
            <i className={`fa-solid ${isDarkMode ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-200'}`}></i>
          </button>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border border-white/20 dark:border-slate-800 overflow-hidden">
          <div className="p-10">
            <div className="flex flex-col items-center mb-10">
              <div className="p-2 rounded-full mb-6 ring-4 ring-blue-600/20 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
                <Logo className="w-24 h-24" siteLogo={siteLogo} siteName={siteName} />
              </div>
              <h1 className="text-2xl font-black italic uppercase text-slate-900 dark:text-white">
                {firstPart} <span className="text-blue-600">{restPart}</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2">{t.loginSubtitle}</p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-black dark:text-white">
                {view === 'signIn' ? t.signIn : view === 'signUp' ? t.signUp : t.resetPassword}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {view === 'forgotPassword' ? t.backToLogin : (language === 'en' ? 'Access your administrative control panel' : 'আপনার প্রশাসনিক কন্ট্রোল প্যানেল অ্যাক্সেস করুন')}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <i className="fa-solid fa-circle-exclamation"></i>
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <i className="fa-solid fa-circle-check"></i>
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">{t.username}</label>
                <div className="relative group">
                  <i className="fa-solid fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"></i>
                  <input 
                    required 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all font-medium text-sm dark:text-white"
                    placeholder="e.g. admin_doel"
                  />
                </div>
              </div>

              {view === 'signUp' && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">{t.email}</label>
                  <div className="relative group">
                    <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"></i>
                    <input 
                      required 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all font-medium text-sm dark:text-white"
                      placeholder="e.g. pilot@doelexpress.com"
                    />
                  </div>
                </div>
              )}

              {view !== 'forgotPassword' && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.password}</label>
                    {view === 'signIn' && (
                      <button 
                        type="button"
                        onClick={() => setView('forgotPassword')}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-tighter"
                      >
                        {t.forgotPassword}
                      </button>
                    )}
                  </div>
                  <div className="relative group">
                    <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"></i>
                    <input 
                      required 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all font-medium text-sm dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {view === 'signUp' && (
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">{t.confirmPassword}</label>
                  <div className="relative group">
                    <i className="fa-solid fa-shield-check absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors"></i>
                    <input 
                      required 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-600 outline-none transition-all font-medium text-sm dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-600/40 transition-all active:scale-[0.98] uppercase tracking-widest text-xs mt-6"
              >
                {view === 'signIn' ? t.signIn : view === 'signUp' ? t.signUp : t.resetPassword}
              </button>
            </form>

            <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 text-center">
              {view === 'signIn' ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {language === 'en' ? "Don't have an account?" : "অ্যাকাউন্ট নেই?"} {' '}
                  <button onClick={() => setView('signUp')} className="text-blue-600 font-bold hover:underline">
                    {t.signUp}
                  </button>
                </p>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {view === 'signUp' ? (language === 'en' ? "Already have an account?" : "আগের অ্যাকাউন্ট আছে?") : t.backToLogin} {' '}
                  <button onClick={() => setView('signIn')} className="text-blue-600 font-bold hover:underline">
                    {t.signIn}
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;