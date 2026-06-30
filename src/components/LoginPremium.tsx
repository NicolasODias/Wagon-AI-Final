import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, isSupabaseConfigured, getSupabaseErrorMsg, fetchCurrentUserProfile } from '../lib/supabaseClient';
import { 
  Building2, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Check, 
  Loader2, 
  AlertCircle, 
  Cpu, 
  TrendingUp, 
  Coins, 
  ShieldCheck,
  LifeBuoy
} from 'lucide-react';

interface LoginPremiumProps {
  onLoginSuccess: (user: any, token: string) => void;
  theme: 'light' | 'dark';
}

export default function LoginPremium({ onLoginSuccess, theme }: LoginPremiumProps) {
  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Recovery wizard states: 'login' | 'forgot' | 'reset'
  const [authView, setAuthView] = useState<'login' | 'forgot' | 'reset'>('login');
  
  // Password reset state
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status indicators
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load remembered access on mount
  useEffect(() => {
    const remembered = localStorage.getItem('wagon_ai_remembered_email');
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
  }, []);

  // Handle logging in
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Por favor, digite suas credenciais.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const sanitizedEmail = email.toLowerCase().trim();

    try {
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: sanitizedEmail,
          password
        });

        if (error) throw error;
        if (!data.user || !data.session) {
          throw new Error('Não foi possível iniciar a sessão.');
        }

        let mappedUser;
        try {
          mappedUser = await fetchCurrentUserProfile(data.session.access_token);
        } catch (profileError) {
          await supabase.auth.signOut();
          throw profileError;
        }

        if (rememberMe) {
          localStorage.setItem('wagon_ai_remembered_email', sanitizedEmail);
        } else {
          localStorage.removeItem('wagon_ai_remembered_email');
        }

        setSuccessMsg('Bem-vindo de volta! Autenticando ' + mappedUser.name + '...');
        setTimeout(() => {
          onLoginSuccess(mappedUser, data.session.access_token);
        }, 600);
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: sanitizedEmail, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha na autenticação.');

        if (rememberMe) {
          localStorage.setItem('wagon_ai_remembered_email', sanitizedEmail);
        } else {
          localStorage.removeItem('wagon_ai_remembered_email');
        }

        setSuccessMsg('Bem-vindo de volta! Autenticando ' + data.user.name + '...');
        setTimeout(() => onLoginSuccess(data.user, data.token), 600);
      }
    } catch (err: any) {
      setErrorMsg(getSupabaseErrorMsg(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      setErrorMsg('Por favor, informe o seu e-mail.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const sanitizedEmail = resetEmail.toLowerCase().trim();

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        setSuccessMsg('E-mail de recuperação enviado via Supabase! Por favor, verifique sua caixa de entrada.');
      } else {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: sanitizedEmail }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao enviar e-mail de recuperação.');
        }

        // Automatically fill reset credentials to make simulator exceptionally user-friendly
        if (data.code) {
          setResetToken(data.code);
        }

        setSuccessMsg('Código gerado com sucesso! Insira-o abaixo junto com sua nova senha.');
        
        // Advance to reset password state
        setTimeout(() => {
          setAuthView('reset');
          setErrorMsg(null);
          setSuccessMsg(null);
        }, 1500);
      }

    } catch (err: any) {
      setErrorMsg(getSupabaseErrorMsg(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Password Reset
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetToken || !newPassword) {
      setErrorMsg('Todos os campos são obrigatórios.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const sanitizedEmail = resetEmail.toLowerCase().trim();

    try {
      if (isSupabaseConfigured) {
        const { error: otpError } = await supabase.auth.verifyOtp({
          email: sanitizedEmail,
          token: resetToken,
          type: 'recovery'
        });
        if (otpError) throw otpError;

        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword
        });
        if (updateError) throw updateError;

        setSuccessMsg('Sua senha foi redefinida no Supabase com sucesso!');
        setTimeout(() => {
          setAuthView('login');
          setPassword('');
          setErrorMsg(null);
          setSuccessMsg(null);
        }, 2000);
      } else {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: sanitizedEmail,
            token: resetToken,
            newPassword: newPassword
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Erro ao redefinir sua senha.');
        }

        setSuccessMsg('Senha alterada! Redirecionando para a tela de login...');
        
        setTimeout(() => {
          setAuthView('login');
          setPassword('');
          setErrorMsg(null);
          setSuccessMsg(null);
        }, 2000);
      }

    } catch (err: any) {
      setErrorMsg(getSupabaseErrorMsg(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] min-h-0 w-screen flex overflow-hidden bg-[#F5F7FB] font-sans text-[#1e293b]">
      
      {/* LEFT SIDE: Premium visual abstract panel (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#1F3767] text-white flex-col justify-between overflow-hidden p-12 select-none">
        
        {/* Tech Grid / Glowing Vectors Backdrop */}
        <div className="absolute inset-0 z-0">
          {/* Subtle Linear Grid */}
          <div 
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />
          
          {/* Ambient Blur Lights */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1E94CF]/20 rounded-full blur-[100px] pointer-events-none animate-pulse duration-5000" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#8BC039]/10 rounded-full blur-[90px] pointer-events-none" />
          
          {/* Abstract geometric vector elements */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grid-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1E94CF" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#1F3767" stopOpacity="0" />
                <stop offset="100%" stopColor="#8BC039" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            <path d="M-100,200 Q200,50 400,300 T900,100" fill="none" stroke="url(#grid-glow)" strokeWidth="3" />
            <path d="M-50,400 Q300,150 500,450 T1000,250" fill="none" stroke="url(#grid-glow)" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Decorative Floating Spheres */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <motion.div 
            animate={{ y: [0, -15, 0], scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
            className="absolute top-24 right-20 w-16 h-16 rounded-full bg-gradient-to-tr from-[#1E94CF]/40 to-transparent border border-white/10 backdrop-blur-md"
          />
          <motion.div 
            animate={{ y: [0, 20, 0], scale: [1, 0.96, 1] }}
            transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
            className="absolute bottom-32 left-16 w-24 h-24 rounded-full bg-gradient-to-bl from-[#8BC039]/20 to-transparent border border-white/5 backdrop-blur-sm"
          />
          <motion.div 
            animate={{ x: [0, 10, 0], y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/3 w-10 h-10 rounded-full bg-indigo-500/10 border border-white/5 backdrop-blur-xs"
          />
        </div>

        {/* Brand Header */}
        <div className="z-10 flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#1E94CF] to-[#1F3767] ring-1 ring-white/20 shadow-xl flex items-center justify-center">
            <Cpu className="h-8 w-8 text-white animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-widest text-white flex items-center gap-1.5 uppercase">
              Wagon AI <span className="text-xs bg-[#1E94CF] text-white px-2 py-0.5 rounded-lg select-none tracking-normal font-bold">ERP PRO</span>
            </h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#1E94CF] leading-none mt-1">
              Inteligência para Distribuidoras
            </p>
          </div>
        </div>

        {/* Center Presentation Graphical Engine */}
        <div className="z-10 flex flex-col justify-center my-auto max-w-md space-y-8">
          <div className="space-y-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-[#1E94CF] backdrop-blur-md border border-white/10 pl-2">
              <span className="w-2 h-2 rounded-full bg-[#8BC039] mr-2 block animate-pulse"></span>
              Plataforma Corporativa Ativa
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
              A nova era da gestão integrada
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Controle financeiro de alta performance, roteamento inteligente de estoque, força de vendas CRM e inteligência analítica empresarial em uma única solução executiva.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm space-y-1 hover:bg-white/10 transition-colors duration-300">
              <TrendingUp className="h-5 w-5 text-[#1E94CF]" />
              <h4 className="text-xs font-black uppercase text-slate-200 mt-2">BI em Tempo Real</h4>
              <p className="text-[11px] text-slate-400">Modelagem analítica executiva de última geração.</p>
            </div>
            
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm space-y-1 hover:bg-white/10 transition-colors duration-300">
              <ShieldCheck className="h-5 w-5 text-[#8BC039]" />
              <h4 className="text-xs font-black uppercase text-slate-200 mt-2">Segurança Máxima</h4>
              <p className="text-[11px] text-slate-400">Proteção com criptografia de ponta e JWT.</p>
            </div>
          </div>
        </div>

        {/* Footer info/Enterprise SLA tag */}
        <div className="z-10 flex justify-between items-center text-[10px] text-slate-400 border-t border-white/10 pt-4">
          <span className="font-semibold tracking-wider">WAGON CORE V2.6.4</span>
          <span className="font-semibold">99.999% SLA CERTIFICADO</span>
        </div>

      </div>

      {/* RIGHT SIDE: Card Glassmorphic Login Area */}
      <div className="mobile-scroll min-h-0 w-full lg:w-1/2 flex items-start lg:items-center justify-center overflow-y-auto p-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] md:p-12 bg-radial from-slate-100 to-[#F5F7FB] relative">
        
        {/* Decorative Grid for mobile/tablet backdrops */}
        <div className="absolute inset-0 z-0 lg:hidden opacity-5 pointer-events-none">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)',
              backgroundSize: '40px 40px'
            }}
          />
        </div>

        {/* Main interactive Card Wrapper with Glassmorphism */}
        <div className="w-full max-w-md z-10 space-y-8 animate-fade-in relative">
          
          <div className="text-center space-y-2 lg:hidden">
            {/* Quick logo for small screens */}
            <div className="mx-auto w-12 h-12 rounded-2xl bg-[#1F3767] shadow-lg flex items-center justify-center mb-4">
              <Cpu className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#1F3767]">
              Wagon AI
            </h2>
            <p className="text-xs text-[#1E94CF] uppercase tracking-widest font-bold">
              Inteligência para Distribuidoras
            </p>
          </div>

          {/* Form Card */}
          <motion.div 
            layout
            className="glass-light backdrop-blur-xl border border-white/85 p-8 md:p-10 rounded-3xl shadow-2xl relative overflow-hidden bg-white/80"
          >
            {/* Subtle light-bar top highlights */}
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#1E94CF] via-[#1F3767] to-[#8BC039]" />

            <AnimatePresence mode="wait">
              
              {/* VIEW 1: NORMAL LOGIN */}
              {authView === 'login' && (
                <motion.div
                  key="login-view"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-8">
                    <h3 className="text-xl font-bold text-[#1F3767]">Acessar Conta</h3>
                    <p className="text-xs text-slate-400 mt-1">Insira suas credenciais corporativas registradas.</p>
                  </div>

                  {/* Operational Errors */}
                  {errorMsg && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 mb-5 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-600 text-xs font-semibold flex items-start space-x-2"
                    >
                      <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}

                  {/* Operational Success */}
                  {successMsg && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 mb-5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-600 text-xs font-semibold flex items-center space-x-2"
                    >
                      <Check className="h-4.5 w-4.5 shrink-0" />
                      <span>{successMsg}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleLoginSubmit} className="space-y-5">
                    {/* Email field */}
                    <div className="space-y-1.5">
                      <label htmlFor="login-email" className="text-xs font-bold text-slate-600 tracking-wide uppercase">E-mail Corporativo</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="h-4.5 w-4.5" />
                        </div>
                        <input
                          id="login-email"
                          type="email"
                          required
                          placeholder="Digite seu e-mail"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E94CF]/20 focus:border-[#1E94CF] bg-white/50 transition-all font-semibold"
                        />
                      </div>
                    </div>

                    {/* Password field */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label htmlFor="login-password" className="text-xs font-bold text-slate-600 tracking-wide uppercase">Senha de Acesso</label>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="h-4.5 w-4.5" />
                        </div>
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Digite sua senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E94CF]/20 focus:border-[#1E94CF] bg-white/50 transition-all font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#1E94CF] transition-colors focus:outline-none"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Helpers */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center space-x-2 cursor-pointer select-none font-semibold text-slate-500">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-300 text-[#1F3767] focus:ring-[#1F3767] h-4 w-4"
                        />
                        <span>Lembrar acesso</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMsg(null);
                          setSuccessMsg(null);
                          setResetEmail(email); // copy if prefilled
                          setAuthView('forgot');
                        }}
                        className="font-bold text-[#1F3767] hover:text-[#1E94CF] transition-colors hover:underline focus:outline-none"
                      >
                        Esqueci minha senha
                      </button>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-[#1F3767] hover:bg-[#1E94CF] text-white font-extrabold text-sm transition-all shadow-lg active:scale-98 flex items-center justify-center space-x-2 cursor-pointer hover:shadow-xl duration-300"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin" />
                          <span>Autenticando...</span>
                        </>
                      ) : (
                        <span>Entrar</span>
                      )}
                    </button>
                  </form>

                </motion.div>
              )}

              {/* VIEW 2: FORGOT PASSWORD */}
              {authView === 'forgot' && (
                <motion.div
                  key="forgot-view"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        setSuccessMsg(null);
                        setAuthView('login');
                      }}
                      className="p-2 text-slate-400 hover:text-[#1F3767] hover:bg-[#1F3767]/5 rounded-lg transition-all focus:outline-none"
                    >
                      <ArrowLeft className="h-4.5 w-4.5" />
                    </button>
                    <div>
                      <h3 className="text-lg font-bold text-[#1F3767]">Recuperar Senha</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Enviaremos um código simulado de segurança.</p>
                    </div>
                  </div>

                  {/* Operational Errors */}
                  {errorMsg && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-600 text-xs font-semibold flex items-start space-x-2"
                    >
                      <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}

                  {/* Operational Success */}
                  {successMsg && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-600 text-xs font-semibold flex items-center space-x-2"
                    >
                      <Check className="h-4.5 w-4.5 shrink-0" />
                      <span>{successMsg}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-5">
                    <div className="space-y-1.5">
                      <label htmlFor="reset-email" className="text-xs font-bold text-slate-600 tracking-wide uppercase">E-mail Cadastrado</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="h-4.5 w-4.5" />
                        </div>
                        <input
                          id="reset-email"
                          type="email"
                          required
                          placeholder="Digite seu e-mail"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E94CF]/20 focus:border-[#1E94CF] bg-white/50 transition-all font-semibold"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Insira o e-mail cadastrado (Ex: <span className="font-mono">edilson.adm@wagon.com</span>).</p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-[#1F3767] hover:bg-[#1E94CF] text-white font-extrabold text-sm transition-all shadow-lg active:scale-98 flex items-center justify-center space-x-2 cursor-pointer hover:shadow-xl duration-300"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin" />
                          <span>Buscando conta...</span>
                        </>
                      ) : (
                        <span>Enviar Código de Recuperação</span>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* VIEW 3: RESET CODE AND PASSWORD INPUT */}
              {authView === 'reset' && (
                <motion.div
                  key="reset-view"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        setSuccessMsg(null);
                        setAuthView('forgot');
                      }}
                      className="p-2 text-slate-400 hover:text-[#1F3767] hover:bg-[#1F3767]/5 rounded-lg transition-all focus:outline-none"
                    >
                      <ArrowLeft className="h-4.5 w-4.5" />
                    </button>
                    <div>
                      <h3 className="text-lg font-bold text-[#1F3767]">Definir Nova Senha</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Insira o token verificado e sua nova senha.</p>
                    </div>
                  </div>

                  {/* Operational Errors */}
                  {errorMsg && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-600 text-xs font-semibold flex items-start space-x-2"
                    >
                      <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                      <span>{errorMsg}</span>
                    </motion.div>
                  )}

                  {/* Operational Success */}
                  {successMsg && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-600 text-xs font-semibold flex items-center space-x-2"
                    >
                      <Check className="h-4.5 w-4.5 shrink-0" />
                      <span>{successMsg}</span>
                    </motion.div>
                  )}

                  <form onSubmit={handleResetPasswordSubmit} className="space-y-5">
                    
                    {/* E-mail confirmed info */}
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail em Recuperação</span>
                      <p className="text-xs font-bold text-[#1F3767] bg-[#1E94CF]/5 p-2 rounded-lg border border-slate-100">{resetEmail}</p>
                    </div>

                    {/* Reset Token Input */}
                    <div className="space-y-1.5">
                      <label htmlFor="reset-token" className="text-xs font-bold text-slate-600 tracking-wide uppercase">Código de Segurança (6 dígitos)</label>
                      <input
                        id="reset-token"
                        type="text"
                        required
                        placeholder="Digite o código enviado"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm tracking-widest text-center font-extrabold focus:outline-none focus:ring-2 focus:ring-[#1E94CF]/20 focus:border-[#1E94CF] bg-white/50 transition-all text-[#1F3767]"
                      />
                      <p className="text-[10px] text-slate-400 font-medium">O simulador autocompletou o código enviado ao seu console.</p>
                    </div>

                    {/* New Password Input */}
                    <div className="space-y-1.5">
                      <label htmlFor="new-password" className="text-xs font-bold text-slate-600 tracking-wide uppercase">Crie Nova Senha</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Lock className="h-4.5 w-4.5" />
                        </div>
                        <input
                          id="new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          placeholder="Nova senha segura"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E94CF]/20 focus:border-[#1E94CF] bg-white/50 transition-all font-semibold animate-slide-up"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-[#1E94CF] transition-colors focus:outline-none"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 rounded-xl bg-[#1F3767] hover:bg-[#1E94CF] text-white font-extrabold text-sm transition-all shadow-lg active:scale-98 flex items-center justify-center space-x-2 cursor-pointer hover:shadow-xl duration-300"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4.5 w-4.5 animate-spin" />
                          <span>Atualizando senha...</span>
                        </>
                      ) : (
                        <span>Redefinir e Salvar</span>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>

          {/* SLA / Technical footnote */}
          <div className="text-center text-[10px] text-slate-400 font-semibold flex items-center justify-center space-x-1 pl-4">
            <ShieldCheck className="h-3.5 w-3.5 text-[#8BC039]" />
            <span>Infraestrutura certificada Wagon AI. Acesso seguro HTTPS.</span>
          </div>

        </div>

      </div>

    </div>
  );
}
