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
  updateProfilePhoto: (photoUrl: string) => Promise<void>;
  activeUserGoals: MonthlyGoals;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface LocalUserRecord {
  id: string;
  email: string;
  password: string;
  displayName: string;
  photoURL?: string;
}

function getLocalUsers(): LocalUserRecord[] {
  try {
    const raw = localStorage.getItem('fitrank_local_users');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalUsers(users: LocalUserRecord[]) {
  localStorage.setItem('fitrank_local_users', JSON.stringify(users));
}

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
        photoURL: currentProfile?.photo_url || sbUser.user_metadata?.avatar_url || undefined,
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
    const savedPhoto = localStorage.getItem(`fitrank_guest_photo_${guestId}`) || undefined;

    if (savedPhoto) {
      guestUser.photoURL = savedPhoto;
    }

    const guestProfile: UserProfile = {
      uid: guestId,
      email: `${guestId}@fitrank.guest`,
      displayName: cleanName,
      photoURL: savedPhoto,
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
        // 1. Check guest session
        const guestId = localStorage.getItem('fitrank_guest_id');
        const guestName = localStorage.getItem('fitrank_guest_name');
        if (guestId && guestName) {
          await loginAsGuest(guestName);
          setLoading(false);
          return;
        }

        // 2. Check local offline user session
        const localSessionId = localStorage.getItem('fitrank_local_session');
        if (localSessionId && !isSupabaseConfigured) {
          const users = getLocalUsers();
          const found = users.find((u) => u.id === localSessionId);
          if (found) {
            const authUser: AuthUser = {
              uid: found.id,
              id: found.id,
              email: found.email,
              displayName: found.displayName,
              photoURL: found.photoURL,
              emailVerified: true,
            };
            const savedGoalsJson = localStorage.getItem(`fitrank_goals_${found.id}`);
            const savedGoals = savedGoalsJson ? JSON.parse(savedGoalsJson) : DEFAULT_GOALS;

            const profile: UserProfile = {
              uid: found.id,
              email: found.email,
              displayName: found.displayName,
              photoURL: found.photoURL,
              goalPullUps: savedGoals.pullUps,
              goalPushUps: savedGoals.pushUps,
              goalSitUps: savedGoals.sitUps,
              goalRunningKm: savedGoals.runningKm,
            };

            if (isMounted) {
              setUser(authUser);
              setProfile(profile);
              setLoading(false);
            }
            return;
          }
        }

        // 3. Check Supabase session
        if (isSupabaseConfigured) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await loadProfileForUser(session.user);
          } else {
            if (isMounted) {
              setUser(null);
              setProfile(null);
            }
          }
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

    let authListener: any = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        const guestId = localStorage.getItem('fitrank_guest_id');
        const localSessionId = localStorage.getItem('fitrank_local_session');
        if (guestId || localSessionId) return;

        if (session?.user) {
          await loadProfileForUser(session.user);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      });
      authListener = data;
    }

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Register with Email and Password
  const registerWithEmail = async (email: string, pass: string, name: string) => {
    localStorage.removeItem('fitrank_guest_id');
    localStorage.removeItem('fitrank_guest_name');
    localStorage.removeItem('fitrank_local_session');

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          emailRedirectTo: `${window.location.origin}`,
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
    }

    const users = getLocalUsers();
    if (users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      throw new Error('Este e-mail já está cadastrado.');
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newUser: LocalUserRecord = {
      id: userId,
      email: email.trim(),
      password: pass,
      displayName: name.trim(),
    };

    users.push(newUser);
    saveLocalUsers(users);
    localStorage.setItem('fitrank_local_session', userId);

    const authUser: AuthUser = {
      uid: userId,
      id: userId,
      email: newUser.email,
      displayName: newUser.displayName,
      emailVerified: true,
    };

    const profile: UserProfile = {
      uid: userId,
      email: newUser.email,
      displayName: newUser.displayName,
      goalPullUps: DEFAULT_GOALS.pullUps,
      goalPushUps: DEFAULT_GOALS.pushUps,
      goalSitUps: DEFAULT_GOALS.sitUps,
      goalRunningKm: DEFAULT_GOALS.runningKm,
    };

    setUser(authUser);
    setProfile(profile);
    return {};
  };

  // Login with Email and Password
  const loginWithEmail = async (email: string, pass: string) => {
    localStorage.removeItem('fitrank_guest_id');
    localStorage.removeItem('fitrank_guest_name');
    localStorage.removeItem('fitrank_local_session');

    if (isSupabaseConfigured) {
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
      return;
    }

    const users = getLocalUsers();
    const found = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === pass
    );

    if (!found) {
      throw new Error('E-mail ou senha incorretos.');
    }

    localStorage.setItem('fitrank_local_session', found.id);

    const authUser: AuthUser = {
      uid: found.id,
      id: found.id,
      email: found.email,
      displayName: found.displayName,
      photoURL: found.photoURL,
      emailVerified: true,
    };

    const savedGoalsJson = localStorage.getItem(`fitrank_goals_${found.id}`);
    const savedGoals = savedGoalsJson ? JSON.parse(savedGoalsJson) : DEFAULT_GOALS;

    const profile: UserProfile = {
      uid: found.id,
      email: found.email,
      displayName: found.displayName,
      photoURL: found.photoURL,
      goalPullUps: savedGoals.pullUps,
      goalPushUps: savedGoals.pushUps,
      goalSitUps: savedGoals.sitUps,
      goalRunningKm: savedGoals.runningKm,
    };

    setUser(authUser);
    setProfile(profile);
  };

  const loginWithGoogle = async () => {
    localStorage.removeItem('fitrank_guest_id');
    localStorage.removeItem('fitrank_guest_name');
    localStorage.removeItem('fitrank_local_session');

    if (!isSupabaseConfigured) {
      throw new Error('Login com Google exige Supabase configurado.');
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

  const verifyEmailCode = async (code: string, emailStr?: string) => {
    const targetEmail = emailStr || user?.email;

    if (isSupabaseConfigured && targetEmail) {
      const { data, error } = await supabase.auth.verifyOtp({
        email: targetEmail,
        token: code.trim(),
        type: 'signup',
      });

      if (error) {
        const { data: data2, error: error2 } = await supabase.auth.verifyOtp({
          email: targetEmail,
          token: code.trim(),
          type: 'email',
        });

        if (error2) {
          throw new Error(error.message || error2.message || 'Código de verificação incorreto ou expirado.');
        }

        if (data2.user) {
          await loadProfileForUser(data2.user);
        }
      } else if (data.user) {
        await loadProfileForUser(data.user);
      }
    } else {
      setUser((prev) => (prev ? { ...prev, emailVerified: true } : null));
    }
  };

  const resendVerificationCode = async (email?: string): Promise<string> => {
    if (!isSupabaseConfigured) return 'E-mail reenviado com sucesso.';
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

  const forgotPassword = async (email: string): Promise<string> => {
    if (!isSupabaseConfigured) throw new Error('Recuperação de senha exige Supabase configurado.');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}`,
    });

    if (error) {
      throw new Error(error.message || 'Erro ao solicitar recuperação de senha.');
    }
    return 'E-mail de recuperação enviado com sucesso.';
  };

  const resetPassword = async (_email: string, _code: string, newPass: string): Promise<void> => {
    if (!isSupabaseConfigured) throw new Error('Redefinição de senha exige Supabase configurado.');

    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) {
      throw new Error(error.message || 'Erro ao redefinir senha.');
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured && !user?.uid.startsWith('guest_')) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('fitrank_guest_id');
      localStorage.removeItem('fitrank_guest_name');
      localStorage.removeItem('fitrank_local_session');
      setUser(null);
      setProfile(null);
    }
  };

  const updateUserGoals = async (goals: MonthlyGoals) => {
    if (!user) return;

    if (user.uid.startsWith('guest_') || !isSupabaseConfigured) {
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

  const updateDisplayName = async (newName: string) => {
    if (!user) return;

    if (user.uid.startsWith('guest_') || !isSupabaseConfigured) {
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

  const updateProfilePhoto = async (newPhotoUrl: string) => {
    if (!user) return;

    if (user.uid.startsWith('guest_') || !isSupabaseConfigured) {
      localStorage.setItem(`fitrank_guest_photo_${user.uid}`, newPhotoUrl);
      setProfile((prev) => (prev ? { ...prev, photoURL: newPhotoUrl } : null));
      setUser((prev) => (prev ? { ...prev, photoURL: newPhotoUrl } : null));
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ photo_url: newPhotoUrl })
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao atualizar foto no Supabase:', error);
    }

    setProfile((prev) => (prev ? { ...prev, photoURL: newPhotoUrl } : null));
    setUser((prev) => (prev ? { ...prev, photoURL: newPhotoUrl } : null));
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
        updateProfilePhoto,
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
