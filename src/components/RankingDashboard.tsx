import React, { useEffect, useState } from 'react';
import { useAuth } from '../firebase/authContext';
import {
  getMonthRankingData,
  acceptFriendRequest,
  removeFriendConnection,
} from '../firebase/workoutService';
import {
  AthleteProgressSummary,
  FriendConnection,
} from '../types';
import { MONTHS } from './Navbar';
import {
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  Crown,
  Medal,
  RefreshCw,
  Trophy,
  UserCheck,
  Users,
  X,
} from 'lucide-react';

interface RankingDashboardProps {
  selectedMonth: number;
  selectedYear: number;
  connections: FriendConnection[];
  openFriendsModal: () => void;
  openNewActivityModal: () => void;
}

type ExerciseFilter = 'geral' | 'pullUps' | 'pushUps' | 'sitUps' | 'runningKm';

export default function RankingDashboard({
  selectedMonth,
  selectedYear,
  connections,
  openFriendsModal,
  openNewActivityModal,
}: RankingDashboardProps) {
  const { user, profile, activeUserGoals } = useAuth();
  const [rankingList, setRankingList] = useState<AthleteProgressSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [exerciseFilter, setExerciseFilter] = useState<ExerciseFilter>('geral');
  const [actionLoading, setActionLoading] = useState(false);

  const monthObj = MONTHS.find((m) => m.value === selectedMonth) || MONTHS[0];
  const acceptedFriendsCount = connections.filter((c) => c.status === 'accepted').length;
  const pendingInvites = connections.filter((c) => c.status === 'pending' && c.targetId === user?.id);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedMonth, selectedYear, connections]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const currentName = profile?.displayName || user.displayName || (user.email ? user.email.split('@')[0] : 'Atleta');
      const ranking = await getMonthRankingData(
        user.uid,
        currentName,
        selectedYear,
        selectedMonth,
        activeUserGoals
      );
      setRankingList(ranking);
    } catch (err) {
      console.error('Erro ao carregar dados do ranking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (connId: string) => {
    setActionLoading(true);
    try {
      await acceptFriendRequest(connId);
      await loadData();
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async (connId: string) => {
    setActionLoading(true);
    try {
      await removeFriendConnection(connId);
      await loadData();
      window.location.reload();
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  // Sort ranking according to selected filter
  const sortedRanking = [...rankingList].sort((a, b) => {
    if (exerciseFilter === 'pullUps') return b.pullUps - a.pullUps;
    if (exerciseFilter === 'pushUps') return b.pushUps - a.pushUps;
    if (exerciseFilter === 'sitUps') return b.sitUps - a.sitUps;
    if (exerciseFilter === 'runningKm') return b.runningKm - a.runningKm;
    return b.averageScore - a.averageScore;
  });

  const getMetricValue = (ath: AthleteProgressSummary) => {
    if (exerciseFilter === 'pullUps') return `${ath.pullUps} reps`;
    if (exerciseFilter === 'pushUps') return `${ath.pushUps} reps`;
    if (exerciseFilter === 'sitUps') return `${ath.sitUps} reps`;
    if (exerciseFilter === 'runningKm') return `${ath.runningKm} km`;
    return `${ath.averageScore}% média`;
  };

  const getMetricPoints = (ath: AthleteProgressSummary) => {
    if (exerciseFilter === 'pullUps') return ath.pullUps;
    if (exerciseFilter === 'pushUps') return ath.pushUps;
    if (exerciseFilter === 'sitUps') return ath.sitUps;
    if (exerciseFilter === 'runningKm') return Math.round(ath.runningKm * 10) / 10;
    return ath.averageScore * 20;
  };

  const renderAthleteAvatar = (ath: AthleteProgressSummary, sizeClass = "w-12 h-12") => {
    const photo = ath.isCurrentUser ? (profile?.photoURL || ath.avatar) : ath.avatar;
    if (photo) {
      return (
        <div className={`${sizeClass} rounded-full overflow-hidden shadow-md shrink-0 border border-slate-700 bg-slate-800`}>
          <img src={photo} alt={ath.userName} className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div
        className={`${sizeClass} rounded-full text-white font-extrabold flex items-center justify-center shadow-md shrink-0`}
        style={{ backgroundColor: ath.color }}
      >
        {ath.userName?.[0]?.toUpperCase() || 'A'}
      </div>
    );
  };

  const firstPlace = sortedRanking[0];
  const secondPlace = sortedRanking[1];
  const thirdPlace = sortedRanking[2];

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Top Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {[
          { id: 'geral', label: 'Geral' },
          { id: 'pullUps', label: 'Barra Fixa' },
          { id: 'pushUps', label: 'Flexões' },
          { id: 'sitUps', label: 'Abdominais' },
          { id: 'runningKm', label: 'Corrida' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setExerciseFilter(tab.id as ExerciseFilter)}
            className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition shrink-0 ${
              exerciseFilter === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/40'
                : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Pódio (Without "Provisório") */}
      {firstPlace && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              🏆 Pódio
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
              Top Contenders
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-3">
            {/* 2nd Place (Left) */}
            {secondPlace ? (
              <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-3 text-center space-y-2 relative">
                <div className="relative inline-block mx-auto">
                  <div className="mx-auto flex justify-center">
                    {renderAthleteAvatar(secondPlace, "w-12 h-12 sm:w-14 sm:h-14")}
                  </div>
                  {secondPlace.isCurrentUser && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                      Você
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs sm:text-sm truncate">{secondPlace.userName}</h4>
                  <p className="text-[11px] font-mono font-bold text-amber-300">{getMetricValue(secondPlace)}</p>
                </div>
                <div className="bg-slate-900 py-1.5 px-2 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Prata</span>
                  <span className="text-[10px] font-mono font-semibold text-slate-300">
                    -{Math.max(0, getMetricPoints(firstPlace) - getMetricPoints(secondPlace))} pts
                  </span>
                </div>
              </div>
            ) : (
              <div></div>
            )}

            {/* 1st Place (Center / Top) */}
            <div className="bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900 border-2 border-amber-500/50 rounded-3xl p-4 text-center space-y-3 relative shadow-xl shadow-amber-500/10 -mt-3">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow">
                <Crown className="w-3 h-3 text-slate-950" /> 1º Lugar
              </div>

              <div className="relative inline-block mx-auto pt-2">
                <div className="mx-auto flex justify-center ring-4 ring-amber-400/40 rounded-full">
                  {renderAthleteAvatar(firstPlace, "w-16 h-16 sm:w-20 sm:h-20")}
                </div>
                {firstPlace.isCurrentUser && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase shadow">
                    Você
                  </span>
                )}
              </div>

              <div>
                <h3 className="font-black text-white text-sm sm:text-base truncate">{firstPlace.userName}</h3>
                <p className="text-xs sm:text-sm font-mono font-black text-amber-400">{getMetricValue(firstPlace)}</p>
              </div>

              <div className="bg-gradient-to-r from-amber-500/20 to-yellow-600/20 py-2 px-3 rounded-2xl border border-amber-500/30 text-amber-300 font-black text-xs uppercase tracking-wider">
                Campeão Max
              </div>
            </div>

            {/* 3rd Place (Right) */}
            {thirdPlace ? (
              <div className="bg-slate-850/80 border border-slate-800 rounded-2xl p-3 text-center space-y-2 relative">
                <div className="relative inline-block mx-auto">
                  <div className="mx-auto flex justify-center">
                    {renderAthleteAvatar(thirdPlace, "w-12 h-12 sm:w-14 sm:h-14")}
                  </div>
                  {thirdPlace.isCurrentUser && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full uppercase">
                      Você
                    </span>
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-white text-xs sm:text-sm truncate">{thirdPlace.userName}</h4>
                  <p className="text-[11px] font-mono font-bold text-amber-300">{getMetricValue(thirdPlace)}</p>
                </div>
                <div className="bg-slate-900 py-1.5 px-2 rounded-xl border border-slate-800">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Bronze</span>
                  <span className="text-[10px] font-mono font-semibold text-slate-300">
                    -{Math.max(0, getMetricPoints(firstPlace) - getMetricPoints(thirdPlace))} pts
                  </span>
                </div>
              </div>
            ) : (
              <div></div>
            )}
          </div>
        </div>
      )}

      {/* Tabela Geral de Rendimento */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
            <Medal className="w-5 h-5 text-amber-400" />
            <span>Tabela Geral de Rendimento</span>
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {sortedRanking.length} {sortedRanking.length === 1 ? 'Integrante' : 'Integrantes'}
          </span>
        </div>

        <div className="space-y-3">
          {sortedRanking.map((ath, idx) => {
            const pct = exerciseFilter === 'geral' ? ath.averageScore : Math.min(300, Math.round((getMetricPoints(ath) / (exerciseFilter === 'pullUps' ? (activeUserGoals.pullUps || 200) : exerciseFilter === 'pushUps' ? (activeUserGoals.pushUps || 1000) : exerciseFilter === 'sitUps' ? (activeUserGoals.sitUps || 500) : (activeUserGoals.runningKm || 50))) * 100));

            return (
              <div
                key={ath.userId}
                className={`p-3.5 sm:p-4 rounded-2xl border transition ${
                  ath.isCurrentUser
                    ? 'bg-blue-600/10 border-blue-500/40 ring-1 ring-blue-500/30 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-850/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 truncate">
                    <span className="font-black text-sm sm:text-base text-amber-400 w-6 text-center shrink-0 font-mono">
                      {idx === 0 ? '1' : idx === 1 ? '2' : idx === 2 ? '3' : `${idx + 1}`}
                    </span>
                    {renderAthleteAvatar(ath, "w-9 h-9 sm:w-10 sm:h-10")}
                    <div className="truncate">
                      {/* Properly formatted and aligned flex row for name and tags */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-white text-sm sm:text-base truncate">{ath.userName}</span>
                        {ath.isCurrentUser && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-600 text-white uppercase tracking-wider shrink-0 shadow">
                            VOCÊ
                          </span>
                        )}
                        {idx === 0 && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 uppercase tracking-wider shrink-0 shadow">
                            LÍDER
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">
                        {exerciseFilter === 'geral'
                          ? `${ath.pullUps + ath.pushUps + ath.sitUps} reps + ${ath.runningKm}km • ${pct}% da meta`
                          : `${getMetricValue(ath)} • ${pct}% da meta`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm sm:text-base font-black text-amber-300 font-mono">
                      {getMetricValue(ath)}
                    </span>
                    {ath.isCurrentUser && (
                      <span className="text-[10px] font-bold text-emerald-400 block mt-0.5">
                        Sua posição
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-500 shadow-sm"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      backgroundColor: ath.color || '#3b82f6',
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Solicitacoes de Amizade */}
      {pendingInvites.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Solicitações de Amizade</span>
            </h3>
            <span className="text-[11px] font-bold text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
              {pendingInvites.length} Pendente{pendingInvites.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/30 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30">
                    {inv.requesterName?.[0] || 'A'}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{inv.requesterName || 'Atleta'}</h4>
                    <p className="text-[11px] text-slate-400">Enviou solicitação para ver seu ranking e sincronizar desempenhos.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleAccept(inv.id!)}
                    disabled={actionLoading}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aceitar</span>
                  </button>
                  <button
                    onClick={() => handleDecline(inv.id!)}
                    disabled={actionLoading}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs border border-slate-700 transition flex items-center justify-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Recusar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


    </div>
  );
}
