import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../firebase/authContext';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Dumbbell,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  UserCheck,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register' | 'guest' | 'verify_email' | 'forgot_password';
  onClose?: () => void;
}

export default function AuthModal({
  isOpen,
  initialMode = 'login',
  onClose,
}: AuthModalProps) {
  const {
    loginWithEmail,
    registerWithEmail,
    verifyEmailCode,
    resendVerificationCode,
    forgotPassword,
    resetPassword,
    loginWithGoogle,
    loginAsGuest,
    user,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'guest' | 'verify_email' | 'forgot_password'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email verification state
  const [verifyCode, setVerifyCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);

  // Password recovery state
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [simulatedResetCode, setSimulatedResetCode] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetMessages = () => {
    setError(null);
    setSuccessMessage(null);
  };

  // 1. Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err?.message || 'Email ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Register
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!name.trim()) {
      setError('Por favor, informe seu nome de atleta.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const result = await registerWithEmail(email, password, name);
      if (result.verificationCode) {
        setSimulatedCode(result.verificationCode);
      }
      setSuccessMessage('Conta criada com sucesso! Enviamos um código de confirmação para o seu e-mail.');
      setMode('verify_email');
    } catch (err: any) {
      setError(err?.message || 'Erro ao criar conta.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Guest Login
  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!name.trim()) {
      setError('Por favor, informe o seu nome para continuar.');
      return;
    }

    setLoading(true);
    try {
      await loginAsGuest(name.trim());
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      if (onClose) onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao entrar como visitante.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Verify Email Code
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!verifyCode.trim()) {
      setError('Por favor, informe o código de 6 dígitos.');
      return;
    }

    setLoading(true);
    try {
      await verifyEmailCode(verifyCode.trim(), email);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setSuccessMessage('E-mail confirmado com sucesso!');
      setTimeout(() => {
        if (onClose) onClose();
      }, 1200);
    } catch (err: any) {
      setError(err?.message || 'Código incorreto ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Email Verification Code
  const handleResendCode = async () => {
    resetMessages();
    setLoading(true);
    try {
      const code = await resendVerificationCode(email);
      setSimulatedCode(code);
      setSuccessMessage('Novo código de verificação enviado para seu e-mail!');
    } catch (err: any) {
      setError(err?.message || 'Erro ao reenviar código.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password Request
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!email.trim()) {
      setError('Informe seu e-mail cadastrado.');
      return;
    }

    setLoading(true);
    try {
      const code = await forgotPassword(email.trim());
      setSimulatedResetCode(code);
      setForgotStep(2);
      setSuccessMessage(`Código de recuperação enviado para ${email.trim()}.`);
    } catch (err: any) {
      setError(err?.message || 'E-mail não encontrado.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Reset Password Submit
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!resetCode.trim()) {
      setError('Digite o código de 6 dígitos.');
      return;
    }
    if (newPassword.length < 6) {
      setError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('As novas senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim(), resetCode.trim(), newPassword);
      setSuccessMessage('Senha alterada com sucesso! Entre agora com sua nova senha.');
      setMode('login');
      setPassword('');
      setForgotStep(1);
    } catch (err: any) {
      setError(err?.message || 'Código incorreto ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    resetMessages();
    setLoading(true);
    try {
      await loginWithGoogle();
      if (onClose) onClose();
    } catch (err: any) {
      setError(err?.message || 'Erro ao autenticar com o Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[94dvh] flex flex-col">
        {/* Brand Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-4 sm:p-5 text-white text-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center mx-auto mb-1.5 sm:mb-2 shadow-inner">
            {mode === 'verify_email' ? (
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            ) : mode === 'forgot_password' ? (
              <KeyRound className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            ) : mode === 'guest' ? (
              <UserCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            ) : (
              <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            )}
          </div>
          <h2 className="text-base sm:text-lg font-black tracking-tight">
            {mode === 'verify_email'
              ? 'Confirmação de E-mail'
              : mode === 'forgot_password'
              ? 'Recuperação de Senha'
              : mode === 'guest'
              ? 'Entrar como Visitante'
              : 'FitRank Desafio Físico'}
          </h2>
          <p className="text-[11px] sm:text-xs text-blue-100 mt-0.5 max-w-xs mx-auto">
            {mode === 'verify_email'
              ? 'Verifique sua caixa de entrada para ativar todas as funções da conta.'
              : mode === 'forgot_password'
              ? 'Redefina sua senha com segurança através do código de 6 dígitos.'
              : mode === 'guest'
              ? 'Acesse instantaneamente sem precisar criar uma conta ou senha.'
              : 'Acompanhe suas metas de barra, flexão, abdominal e corrida com ranking mútuo.'}
          </p>
        </div>

        {/* Tab Toggle */}
        {(mode === 'login' || mode === 'register' || mode === 'guest') && (
          <div className="flex border-b border-slate-800 bg-slate-850 shrink-0">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                resetMessages();
              }}
              className={`flex-1 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold transition border-b-2 touch-manipulation ${
                mode === 'login'
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                resetMessages();
              }}
              className={`flex-1 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold transition border-b-2 touch-manipulation ${
                mode === 'register'
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Criar Conta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('guest');
                resetMessages();
              }}
              className={`flex-1 py-2.5 sm:py-3 text-[11px] sm:text-xs font-bold transition border-b-2 touch-manipulation ${
                mode === 'guest'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Visitante
            </button>
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {/* Alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}

          {/* ============================================================== */}
          {/* MODE: LOGIN                                                   */}
          {/* ============================================================== */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="seuemail@exemplo.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setForgotStep(1);
                      resetMessages();
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar no FitRank'}
              </button>

              {/* Google Sign-in */}
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500 font-semibold">Ou acesse com</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Entrar com Conta Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('guest');
                    resetMessages();
                  }}
                  className="w-full py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Entrar como Visitante (Sem Senha)</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* MODE: GUEST                                                   */}
          {/* ============================================================== */}
          {mode === 'guest' && (
            <form onSubmit={handleGuestSubmit} className="space-y-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-200 space-y-1">
                <div className="font-bold flex items-center gap-1 text-emerald-400 text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  Acesso Instantâneo
                </div>
                <p className="leading-relaxed">
                  Informe apenas seu nome de atleta para acessar o FitRank, registrar seus treinos diários e acompanhar suas metas sem precisar criar senha ou e-mail.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Seu Nome de Atleta
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Ex: João Silva ou Visitante"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Acessando...' : 'Entrar no FitRank como Visitante'}
              </button>
            </form>
          )}

          {/* ============================================================== */}
          {/* MODE: REGISTER                                                */}
          {/* ============================================================== */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nome do Atleta
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Ex: Allan Kayro"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="seuemail@exemplo.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError(null);
                    }}
                    placeholder="Repita a senha"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Após o cadastro, você poderá acessar de qualquer dispositivo.</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Cadastrando...' : 'Cadastrar Atleta'}
              </button>
            </form>
          )}

          {/* ============================================================== */}
          {/* MODE: VERIFY EMAIL                                             */}
          {/* ============================================================== */}
          {mode === 'verify_email' && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="text-center">
                <p className="text-xs text-slate-300">
                  Enviamos um código de confirmação de 6 dígitos para:
                </p>
                <p className="text-sm font-bold text-blue-400 mt-0.5">{email || user?.email}</p>
              </div>

              {simulatedCode && (
                <div className="p-3 bg-blue-950/60 border border-blue-500/30 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-blue-300 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-blue-400" />
                      Caixa de Entrada (Simulação de E-mail)
                    </span>
                    <button
                      type="button"
                      onClick={() => setVerifyCode(simulatedCode)}
                      className="text-[10px] text-amber-300 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Copy className="w-3 h-3" />
                      Preencher código
                    </button>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-lg text-center font-mono font-extrabold text-lg text-amber-300 tracking-widest border border-slate-700">
                    {simulatedCode}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1 text-center">
                  Digite o código de 6 dígitos
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 text-center text-xl font-mono tracking-widest font-bold text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading || verifyCode.length < 6}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? 'Verificando...' : 'Confirmar Meu E-mail'}
              </button>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={loading}
                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reenviar código</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    resetMessages();
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  Voltar ao login
                </button>
              </div>
            </form>
          )}

          {/* ============================================================== */}
          {/* MODE: FORGOT PASSWORD                                          */}
          {/* ============================================================== */}
          {mode === 'forgot_password' && (
            <div>
              {forgotStep === 1 ? (
                <form onSubmit={handleForgotRequest} className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Informe seu e-mail cadastrado
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="seuemail@exemplo.com"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? 'Enviando...' : 'Enviar Código de Recuperação'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        resetMessages();
                      }}
                      className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1 mx-auto"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar para o login</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetSubmit} className="space-y-3.5">
                  {simulatedResetCode && (
                    <div className="p-3 bg-amber-950/60 border border-amber-500/30 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                          Código de Recuperação (Simulação)
                        </span>
                        <button
                          type="button"
                          onClick={() => setResetCode(simulatedResetCode)}
                          className="text-[10px] text-blue-300 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <Copy className="w-3 h-3" />
                          Preencher código
                        </button>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg text-center font-mono font-extrabold text-lg text-amber-300 tracking-widest border border-slate-700">
                        {simulatedResetCode}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Código de 6 dígitos
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                      required
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="000000"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2 px-3 text-center text-lg font-mono tracking-widest font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-10 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {loading ? 'Alterando...' : 'Redefinir Senha'}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        resetMessages();
                      }}
                      className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1 mx-auto"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Voltar para o login</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
