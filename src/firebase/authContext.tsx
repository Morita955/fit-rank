import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEFAULT_GOALS, MonthlyGoals, UserProfile } from '../types';

interface AuthUser {
  uid: string;
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  emailVerified?: boolean;
  isGuest?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<{ verificationCode?: string }>;
  verifyEmailCode: (code: string, email?: string) => Promise<void>;
  resendVerificationCode: (email?: string) => Promise<string>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (email: string, code: string, newPass: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: (guestName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserGoals: (goals: MonthlyGoals) => Promise<void>;
  updateDisplayName: (newName: string) => Promise<void>;
  activeUserGoals: MonthlyGoals;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to load or create profile from Supabase `profiles` table
  const loadProfileForUser = async (sbUser: any) => {
    const userId = sbUser.id;
    const userEmail = sbUser.email || '';
    const metaName = sbUser.user_metadata?.display_name || sbUser.user_metadata?.full_name || userEmail.split('@')[0];

    try {
      const { data: existingProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      let currentProfile = existingProfile;

      if (!existingProfile && !error) {
        const newProfile = {
          id: userId,
          email: userEmail,
          display_name: metaName,
          goal_pull_ups: DEFAULT_GOALS.pullUps,
          goal_push_ups: DEFAULT_GOALS.pushUps,
          goal_sit_ups: DEFAULT_GOALS.sitUps,
          goal_running_km: DEFAULT_GOALS.runningKm,
        };

        const { data: created, error: insertErr } = await supabase
          .from('profiles')
          .upsert(newProfile)
          .select()
          .maybeSingle();

        if (!insertErr && created) {
          currentProfile = created;
        } else {
          currentProfile = newProfile;
        }
      }

      const mappedProfile: UserProfile = {
        uid: userId,
        email: userEmail,
        displayName: currentProfile?.display_name || metaName || 'Atleta',
        photoURL: sbUser.user_metadata?.avatar_url || currentProfile?.photo_url || undefined,
        emailVerified: Boolean(sbUser.email_confirmed_at),
        goalPullUps: currentProfile?.goal_pull_ups ?? DEFAULT_GOALS.pullUps,
        goalPushUps: currentProfile?.goal_push_ups ?? DEFAULT_GOALS.pushUps,
        goalSitUps: currentProfile?.goal_sit_ups ?? DEFAULT_GOALS.sitUps,
        goalRunningKm: currentProfile?.goal_running_km ?? DEFAULT_GOALS.runningKm,
        createdAt: currentProfile?.created_at,
        updatedAt: currentProfile?.updated_at,
      };

      const authUser: AuthUser = {
        uid: userId,
        id: userId,
        email: userEmail,
        displayName: mappedProfile.displayName,
        photoURL: mappedProfile.photoURL,
        emailVerified: mappedProfile.emailVerified,
      };

      setUser(authUser);
      setProfile(mappedProfile);
    } catch (err) {
      console.error('Erro ao carregar perfil do Supabase:', err);
      const fallbackUser: AuthUser = {
        uid: userId,
        id: userId,
        email: userEmail,
        displayName: metaName,
        emailVerified: Boolean(sbUser.email_confirmed_at),
      };
      setUser(fallbackUser);
      setProfile({
        uid: userId,
        email: userEmail,
        displayName: metaName,
        goalPullUps: DEFAULT_GOALS.pullUps,
        goalPushUps: DEFAULT_GOALS.pushUps,
        goalSitUps: DEFAULT_GOALS.sitUps,
        goalRunningKm: DEFAULT_GOALS.runningKm,
      });
    }
  };

  // Login as Guest
  const loginAsGuest = async (guestName: string) => {
    const cleanName = guestName.trim() || 'Visitante';
    const existingGuestId = localStorage.getItem('fitrank_guest_id');
    const guestId = existingGuestId || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    localStorage.setItem('fitrank_guest_id', guestId);
    localStorage.setItem('fitrank_guest_name', cleanName);

    const guestUser: AuthUser = {
      uid: guestId,
      id: guestId,
      email: `${guestId}@fitrank.guest`,
      displayName: cleanName,
      emailVerified: true,
      isGuest: true,
    };

    const savedGoalsJson = localStorage.getItem(`fitrank_goals_${guestId}`);
    const savedGoals = savedGoalsJson ? JSON.parse(savedGoalsJson) : DEFAULT_GOALS;

    const guestProfile: UserProfile = {
      uid: guestId,
      email: `${guestId}@fitrank.guest`,
      displayName: cleanName,
      goalPullUps: savedGoals.pullUps,
      goalPushUps: savedGoals.pushUps,
      goalSitUps: savedGoals.sitUps,
      goalRunningKm: savedGoals.runningKm,
    };

    setUser(guestUser);
    setProfile(guestProfile);
  };

  // Check existing session on boot & subscribe to changes
  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const guestId = localStorage.getItem('fitrank_guest_id');
        const guestName = localStorage.getItem('fitrank_guest_name');
        if (guestId && guestName) {
          await loginAsGuest(guestName);
          setLoading(false);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await loadProfileForUser(session.user);
        } else {
          if (isMounted) {
            setUser(null);
            setProfile(null);
          }
        }
      } catch (err) {
        console.error('Erro ao verificar sessão:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const guestId = localStorage.getItem('fitrank_guest_id');
      if (guestId) return;

      if (session?.user) {
        await loadProfileForUser(session.user);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Register with Email and Password
  const registerWithEmail = async (email: string, pass: string, name: string) => {
    localStorage.removeItem('fitrank_guest_id');
    localStorage.removeItem('fitrank_guest_name');

    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { display_name: name },
      },
    });

    if (error) {
      throw new Error(error.message || 'Erro ao criar conta.');
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        display_name: name,
        goal_pull_ups: DEFAULT_GOALS.pullUps,
        goal_push_ups: DEFAULT_GOALS.pushUps,
        goal_sit_ups: DEFAULT_GOALS.sitUps,
        goal_running_km: DEFAULT_GOALS.runningKm,
      });
      await loadProfileForUser(data.user);
    }

    return {};
  };

  // Login with Email and Password
  const loginWithEmail = async (email: string, pass: string) => {
    localStorage.removeItem('fitrank_guest_id');
    localStorage.removeItem('fitrank_guest_name');

    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      throw new Error(error.message || 'Email ou senha incorretos.');
    }

    if (data.user) {
      await loadProfileForUser(data.user);
    }
  };

  // Google Sign In via Supabase OAuth
  const loginWithGoogle = async () => {
    localStorage.removeItem('fitrank_guest_id');
    localStorage.removeItem('fitrank_guest_name');

    if (!isSupabaseConfigured) {
      throw new Error('Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.');
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      throw new Error(error.message || 'Erro ao conectar com Google.');
    }
  };

  // Verify email / OTP code
  const verifyEmailCode = async (_code: string, email?: string) => {
    if (email && user) {
      setUser((prev) => (prev ? { ...prev, emailVerified: true } : null));
    }
  };

  const resendVerificationCode = async (email?: string): Promise<string> => {
    if (!email && !user?.email) throw new Error('Email não informado.');
    const targetEmail = email || user?.email || '';

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: targetEmail,
    });

    if (error) {
      throw new Error(error.message || 'Erro ao reenviar confirmação.');
    }
    return 'Código/Link enviado por e-mail.';
  };

  // Forgot password
  const forgotPassword = async (email: string): Promise<string> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });

    if (error) {
      throw new Error(error.message || 'Erro ao solicitar recuperação de senha.');
    }
    return 'E-mail de recuperação enviado com sucesso.';
  };

  // Reset password
  const resetPassword = async (_email: string, _code: string, newPass: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) {
      throw new Error(error.message || 'Erro ao redefinir senha.');
    }
  };

  // Logout
  const logout = async () => {
    try {
      if (!user?.uid.startsWith('guest_')) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('fitrank_guest_id');
      localStorage.removeItem('fitrank_guest_name');
      setUser(null);
      setProfile(null);
    }
  };

  // Update monthly goals
  const updateUserGoals = async (goals: MonthlyGoals) => {
    if (!user) return;

    if (user.uid.startsWith('guest_')) {
      localStorage.setItem(`fitrank_goals_${user.uid}`, JSON.stringify(goals));
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              goalPullUps: goals.pullUps,
              goalPushUps: goals.pushUps,
              goalSitUps: goals.sitUps,
              goalRunningKm: goals.runningKm,
            }
          : null
      );
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        goal_pull_ups: goals.pullUps,
        goal_push_ups: goals.pushUps,
        goal_sit_ups: goals.sitUps,
        goal_running_km: goals.runningKm,
      })
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao atualizar metas no Supabase:', error);
    }

    setProfile((prev) =>
      prev
        ? {
            ...prev,
            goalPullUps: goals.pullUps,
            goalPushUps: goals.pushUps,
            goalSitUps: goals.sitUps,
            goalRunningKm: goals.runningKm,
          }
        : null
    );
  };

  // Update athlete display name
  const updateDisplayName = async (newName: string) => {
    if (!user) return;

    if (user.uid.startsWith('guest_')) {
      localStorage.setItem('fitrank_guest_name', newName);
      setProfile((prev) => (prev ? { ...prev, displayName: newName } : null));
      setUser((prev) => (prev ? { ...prev, displayName: newName } : null));
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: newName })
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao atualizar nome no Supabase:', error);
    }

    await supabase.auth.updateUser({
      data: { display_name: newName },
    }).catch(() => {});

    setProfile((prev) => (prev ? { ...prev, displayName: newName } : null));
    setUser((prev) => (prev ? { ...prev, displayName: newName } : null));
  };

  const activeUserGoals: MonthlyGoals = {
    pullUps: profile?.goalPullUps ?? DEFAULT_GOALS.pullUps,
    pushUps: profile?.goalPushUps ?? DEFAULT_GOALS.pushUps,
    sitUps: profile?.goalSitUps ?? DEFAULT_GOALS.sitUps,
    runningKm: profile?.goalRunningKm ?? DEFAULT_GOALS.runningKm,
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        loginWithEmail,
        registerWithEmail,
        verifyEmailCode,
        resendVerificationCode,
        forgotPassword,
        resetPassword,
        loginWithGoogle,
        loginAsGuest,
        logout,
        updateUserGoals,
        updateDisplayName,
        activeUserGoals,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
