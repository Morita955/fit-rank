import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  ActivityLog,
  AthleteProgressSummary,
  COLOR_PALETTE,
  DEFAULT_GOALS,
  FriendConnection,
  MONTH_NAMES_SHORT,
  MonthlyGoals,
  PublicProfile,
  USER_COLORS,
} from '../types';

// Helper for local activities storage
function getLocalActivities(userId: string): ActivityLog[] {
  try {
    const key = `fitrank_acts_${userId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalActivities(userId: string, acts: ActivityLog[]) {
  try {
    const key = `fitrank_acts_${userId}`;
    localStorage.setItem(key, JSON.stringify(acts));
  } catch (e) {
    console.error('Error saving local activities:', e);
  }
}

// Log or update a daily activity (CREATE & UPDATE)
export async function saveActivity(
  userId: string,
  _userName: string,
  data: {
    date: string;
    pullUps: number;
    pushUps: number;
    sitUps: number;
    runningKm: number;
    notes?: string;
  },
  existingId?: string
): Promise<string> {
  const actId = existingId || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newActivity: ActivityLog = {
    id: actId,
    userId,
    date: data.date,
    pullUps: Number(data.pullUps || 0),
    pushUps: Number(data.pushUps || 0),
    sitUps: Number(data.sitUps || 0),
    runningKm: Number(data.runningKm || 0),
    notes: data.notes || '',
    createdAt: now,
    updatedAt: now,
  };

  // Always update local storage for instant feedback and offline support
  const localActs = getLocalActivities(userId);
  const existingIdx = localActs.findIndex((a) => a.id === actId);
  if (existingIdx >= 0) {
    localActs[existingIdx] = newActivity;
  } else {
    localActs.unshift(newActivity);
  }
  saveLocalActivities(userId, localActs);

  // If Supabase is configured, sync with database
  if (isSupabaseConfigured && !userId.startsWith('guest_')) {
    try {
      const payload: any = {
        user_id: userId,
        date: data.date,
        pull_ups: Number(data.pullUps || 0),
        push_ups: Number(data.pushUps || 0),
        sit_ups: Number(data.sitUps || 0),
        running_km: Number(data.runningKm || 0),
        notes: data.notes || '',
        updated_at: now,
      };

      if (existingId && !existingId.startsWith('act_')) {
        payload.id = existingId;
      }

      const { data: saved, error } = await supabase
        .from('activities')
        .upsert(payload)
        .select()
        .maybeSingle();

      if (!error && saved?.id) {
        newActivity.id = saved.id;
        const updatedLocal = getLocalActivities(userId).map((a) => (a.id === actId ? newActivity : a));
        saveLocalActivities(userId, updatedLocal);
        return saved.id;
      }
    } catch (err) {
      console.warn('Supabase não disponível no momento. Atividade salva no dispositivo.', err);
    }
  }

  return actId;
}

// Delete an activity (DELETE)
export async function removeActivity(
  activityId: string,
  userId?: string,
  _userName?: string,
  _date?: string
): Promise<void> {
  const currentUserId = userId || localStorage.getItem('fitrank_guest_id') || '';

  if (currentUserId) {
    const localActs = getLocalActivities(currentUserId).filter((a) => a.id !== activityId);
    saveLocalActivities(currentUserId, localActs);
  }

  if (isSupabaseConfigured && currentUserId && !currentUserId.startsWith('guest_') && !activityId.startsWith('act_')) {
    try {
      await supabase.from('activities').delete().eq('id', activityId);
    } catch (e) {
      console.warn('Erro ao deletar no Supabase, removido localmente.', e);
    }
  }
}

// Fetch activities for a specific month (READ)
export async function fetchUserActivities(
  year: number,
  month: number
): Promise<ActivityLog[]> {
  const guestId = localStorage.getItem('fitrank_guest_id');

  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  if (guestId) {
    const localActs = getLocalActivities(guestId);
    return localActs.filter((a) => a.date >= startOfMonth && a.date <= endOfMonth);
  }

  let supabaseActs: ActivityLog[] = [];

  if (isSupabaseConfigured) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startOfMonth)
          .lte('date', endOfMonth)
          .order('date', { ascending: false });

        if (!error && data) {
          supabaseActs = data.map((item: any) => ({
            id: item.id,
            userId: item.user_id,
            date: item.date,
            pullUps: Number(item.pull_ups || 0),
            pushUps: Number(item.push_ups || 0),
            sitUps: Number(item.sit_ups || 0),
            runningKm: Number(item.running_km || 0),
            notes: item.notes,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
          }));
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar do Supabase, usando dados locais.', err);
    }
  }

  let currentUserId = 'local_user';
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) currentUserId = user.id;
  } catch (e) {}

  const localActs = getLocalActivities(currentUserId).filter((a) => a.date >= startOfMonth && a.date <= endOfMonth);

  const map = new Map<string, ActivityLog>();
  supabaseActs.forEach((a) => a.id && map.set(a.id, a));
  localActs.forEach((a) => a.id && map.set(a.id, a));

  return Array.from(map.values()).sort((a, b) => (b.date > a.date ? 1 : -1));
}

// Fetch friend connections for current user
export async function fetchUserConnections(): Promise<FriendConnection[]> {
  const guestId = localStorage.getItem('fitrank_guest_id');
  if (guestId || !isSupabaseConfigured) return [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .or(`requester_id.eq.${user.id},target_id.eq.${user.id}`);

    if (error || !data) return [];

    const userIds = new Set<string>();
    data.forEach((c: any) => {
      userIds.add(c.requester_id);
      userIds.add(c.target_id);
    });

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', Array.from(userIds));

    const profileMap = new Map<string, string>();
    profiles?.forEach((p: any) => profileMap.set(p.id, p.display_name));

    return data.map((item: any) => ({
      id: item.id,
      userA: item.requester_id,
      userB: item.target_id,
      requesterId: item.requester_id,
      targetId: item.target_id,
      requesterName: profileMap.get(item.requester_id) || 'Atleta',
      targetName: profileMap.get(item.target_id) || 'Atleta',
      participants: [item.requester_id, item.target_id],
      status: item.status,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  } catch (e) {
    return [];
  }
}

// Send a friend connection invite
export async function sendFriendRequest(
  requester: { uid: string; displayName: string },
  target: { uid: string; displayName?: string }
): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Conexões exigem Supabase configurado.');
  }

  const { error } = await supabase.from('connections').insert({
    requester_id: requester.uid,
    target_id: target.uid,
    status: 'pending',
  });

  if (error) {
    throw new Error(error.message || 'Erro ao enviar solicitação.');
  }
}

// Accept a friend connection
export async function acceptFriendRequest(
  connectionId: string,
  _currentUserId?: string,
  _currentUserName?: string
): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('connections')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', connectionId);

  if (error) {
    throw new Error(error.message || 'Erro ao aceitar solicitação.');
  }
}

// Decline or remove a friend connection
export async function removeFriendConnection(connectionId: string): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('id', connectionId);

  if (error) {
    throw new Error(error.message || 'Erro ao remover conexão.');
  }
}

// Search registered athletes
export async function searchPublicProfiles(
  currentUserId: string,
  searchTerm: string = ''
): Promise<PublicProfile[]> {
  if (!isSupabaseConfigured) return [];

  try {
    let query = supabase
      .from('profiles')
      .select('id, display_name, email, photo_url, updated_at')
      .neq('id', currentUserId);

    if (searchTerm.trim()) {
      query = query.or(`display_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
    }

    const { data, error } = await query.limit(20);
    if (error || !data) return [];

    return data.map((item: any) => ({
      uid: item.id,
      displayName: item.display_name,
      email: item.email,
      photoURL: item.photo_url,
      updatedAt: item.updated_at,
    }));
  } catch (e) {
    return [];
  }
}

// Get monthly ranking (current user + accepted friends)
export async function getMonthRankingData(
  currentUserId: string,
  currentUserName: string,
  year: number,
  month: number,
  userGoals: MonthlyGoals = DEFAULT_GOALS
): Promise<AthleteProgressSummary[]> {
  if (!currentUserId) return [];

  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endOfMonth = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  const localActs = getLocalActivities(currentUserId).filter((a) => a.date >= startOfMonth && a.date <= endOfMonth);

  let athleteIdsArray = [currentUserId];
  let profileMap = new Map<string, any>();
  let supabaseActs: any[] = [];

  if (isSupabaseConfigured && !currentUserId.startsWith('guest_')) {
    try {
      const { data: connections } = await supabase
        .from('connections')
        .select('requester_id, target_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${currentUserId},target_id.eq.${currentUserId}`);

      const athleteIds = new Set<string>([currentUserId]);
      connections?.forEach((c: any) => {
        athleteIds.add(c.requester_id);
        athleteIds.add(c.target_id);
      });

      athleteIdsArray = Array.from(athleteIds);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', athleteIdsArray);

      profiles?.forEach((p: any) => profileMap.set(p.id, p));

      const { data: activities } = await supabase
        .from('activities')
        .select('*')
        .in('user_id', athleteIdsArray)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      if (activities) supabaseActs = activities;
    } catch (e) {
      console.warn('Erro ao carregar ranking do Supabase.', e);
    }
  }

  const totalsMap = new Map<
    string,
    { pullUps: number; pushUps: number; sitUps: number; runningKm: number }
  >();

  athleteIdsArray.forEach((id) => {
    totalsMap.set(id, { pullUps: 0, pushUps: 0, sitUps: 0, runningKm: 0 });
  });

  // Calculate local user totals
  const localTotals = localActs.reduce(
    (acc, a) => ({
      pullUps: acc.pullUps + (a.pullUps || 0),
      pushUps: acc.pushUps + (a.pushUps || 0),
      sitUps: acc.sitUps + (a.sitUps || 0),
      runningKm: acc.runningKm + (a.runningKm || 0),
    }),
    { pullUps: 0, pushUps: 0, sitUps: 0, runningKm: 0 }
  );

  supabaseActs.forEach((act: any) => {
    const existing = totalsMap.get(act.user_id) || { pullUps: 0, pushUps: 0, sitUps: 0, runningKm: 0 };
    totalsMap.set(act.user_id, {
      pullUps: existing.pullUps + Number(act.pull_ups || 0),
      pushUps: existing.pushUps + Number(act.push_ups || 0),
      sitUps: existing.sitUps + Number(act.sit_ups || 0),
      runningKm: existing.runningKm + Number(act.running_km || 0),
    });
  });

  // Override/merge current user totals with local totals if larger
  const currTotals = totalsMap.get(currentUserId) || { pullUps: 0, pushUps: 0, sitUps: 0, runningKm: 0 };
  totalsMap.set(currentUserId, {
    pullUps: Math.max(currTotals.pullUps, localTotals.pullUps),
    pushUps: Math.max(currTotals.pushUps, localTotals.pushUps),
    sitUps: Math.max(currTotals.sitUps, localTotals.sitUps),
    runningKm: Math.max(currTotals.runningKm, localTotals.runningKm),
  });

  const rankings: AthleteProgressSummary[] = athleteIdsArray.map((id, index) => {
    const prof = profileMap.get(id);
    const totals = totalsMap.get(id) || { pullUps: 0, pushUps: 0, sitUps: 0, runningKm: 0 };
    const name = id === currentUserId ? currentUserName : prof?.display_name || 'Atleta';

    const goals: MonthlyGoals = {
      pullUps: prof?.goal_pull_ups ?? userGoals.pullUps,
      pushUps: prof?.goal_push_ups ?? userGoals.pushUps,
      sitUps: prof?.goal_sit_ups ?? userGoals.sitUps,
      runningKm: prof?.goal_running_km ?? userGoals.runningKm,
    };

    const pctPullUps = Math.round((totals.pullUps / (goals.pullUps || 1)) * 100);
    const pctPushUps = Math.round((totals.pushUps / (goals.pushUps || 1)) * 100);
    const pctSitUps = Math.round((totals.sitUps / (goals.sitUps || 1)) * 100);
    const pctRunningKm = Math.round((totals.runningKm / (goals.runningKm || 1)) * 100);

    const averageScore = Math.round((pctPullUps + pctPushUps + pctSitUps + pctRunningKm) / 4);
    const color = USER_COLORS[name] || COLOR_PALETTE[index % COLOR_PALETTE.length];

    return {
      userId: id,
      userName: name,
      color,
      avatar: prof?.photo_url,
      isCurrentUser: id === currentUserId,
      pullUps: totals.pullUps,
      pushUps: totals.pushUps,
      sitUps: totals.sitUps,
      runningKm: totals.runningKm,
      pctPullUps,
      pctPushUps,
      pctSitUps,
      pctRunningKm,
      averageScore,
    };
  });

  return rankings.sort((a, b) => b.averageScore - a.averageScore);
}

export interface MultiMonthAthleteHistory {
  userId: string;
  userName: string;
  color: string;
  isCurrentUser: boolean;
  monthlyData: {
    month: number;
    monthName: string;
    pullUps: number;
    pushUps: number;
    sitUps: number;
    runningKm: number;
  }[];
}

// Multi-month spreadsheet history
export async function getMultiMonthSpreadsheetData(
  currentUserId: string,
  currentUserName: string,
  year: number
): Promise<MultiMonthAthleteHistory[]> {
  if (!currentUserId) return [];

  let athleteIdsArray = [currentUserId];
  let profileMap = new Map<string, string>();
  let activities: any[] = [];

  if (isSupabaseConfigured && !currentUserId.startsWith('guest_')) {
    try {
      const { data: connections } = await supabase
        .from('connections')
        .select('requester_id, target_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${currentUserId},target_id.eq.${currentUserId}`);

      const athleteIds = new Set<string>([currentUserId]);
      connections?.forEach((c: any) => {
        athleteIds.add(c.requester_id);
        athleteIds.add(c.target_id);
      });

      athleteIdsArray = Array.from(athleteIds);

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', athleteIdsArray);

      profiles?.forEach((p: any) => profileMap.set(p.id, p.display_name));

      const startDate = `${year - 1}-12-01`;
      const endDate = `${year}-11-30`;

      const { data: acts } = await supabase
        .from('activities')
        .select('*')
        .in('user_id', athleteIdsArray)
        .gte('date', startDate)
        .lte('date', endDate);

      if (acts) activities = acts;
    } catch (e) {}
  }

  const monthSequence = [
    { m: 12, y: year - 1, name: 'Dez' },
    { m: 1, y: year, name: 'Jan' },
    { m: 2, y: year, name: 'Fev' },
    { m: 3, y: year, name: 'Mar' },
    { m: 4, y: year, name: 'Abr' },
    { m: 5, y: year, name: 'Mai' },
    { m: 6, y: year, name: 'Jun' },
    { m: 7, y: year, name: 'Jul' },
    { m: 8, y: year, name: 'Ago' },
    { m: 9, y: year, name: 'Set' },
    { m: 10, y: year, name: 'Out' },
    { m: 11, y: year, name: 'Nov' },
  ];

  const localActs = getLocalActivities(currentUserId);

  return athleteIdsArray.map((id, index) => {
    const name = id === currentUserId ? currentUserName : profileMap.get(id) || 'Atleta';
    const color = USER_COLORS[name] || COLOR_PALETTE[index % COLOR_PALETTE.length];

    const monthlyData = monthSequence.map((seq) => {
      const dbUserMonthActs = activities.filter((act: any) => {
        if (act.user_id !== id) return false;
        const [actYear, actMonth] = act.date.split('-').map(Number);
        return actYear === seq.y && actMonth === seq.m;
      });

      const localUserMonthActs = id === currentUserId
        ? localActs.filter((act) => {
            const [actYear, actMonth] = act.date.split('-').map(Number);
            return actYear === seq.y && actMonth === seq.m;
          })
        : [];

      const pullUps = Math.max(
        dbUserMonthActs.reduce((acc, a) => acc + Number(a.pull_ups || 0), 0),
        localUserMonthActs.reduce((acc, a) => acc + Number(a.pullUps || 0), 0)
      );
      const pushUps = Math.max(
        dbUserMonthActs.reduce((acc, a) => acc + Number(a.push_ups || 0), 0),
        localUserMonthActs.reduce((acc, a) => acc + Number(a.pushUps || 0), 0)
      );
      const sitUps = Math.max(
        dbUserMonthActs.reduce((acc, a) => acc + Number(a.sit_ups || 0), 0),
        localUserMonthActs.reduce((acc, a) => acc + Number(a.sitUps || 0), 0)
      );
      const runningKm = Math.max(
        dbUserMonthActs.reduce((acc, a) => acc + Number(a.running_km || 0), 0),
        localUserMonthActs.reduce((acc, a) => acc + Number(a.runningKm || 0), 0)
      );

      return {
        month: seq.m,
        monthName: seq.name,
        pullUps,
        pushUps,
        sitUps,
        runningKm,
      };
    });

    return {
      userId: id,
      userName: name,
      color,
      isCurrentUser: id === currentUserId,
      monthlyData,
    };
  });
}
