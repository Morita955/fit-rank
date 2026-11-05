import React from 'react';
import { useAuth } from '../firebase/authContext';
import { removeActivity } from '../firebase/workoutService';
import { ActivityLog, MonthlyGoals } from '../types';
import { MONTHS } from './Navbar';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  Edit2,
  Flame,
  Footprints,
  Info,
  Lock,
  Plus,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';

interface PersonalDashboardProps {
  selectedMonth: number;
  selectedYear: number;
  activities: ActivityLog[];
  openNewActivityModal: () => void;
  onEditActivity: (activity: ActivityLog) => void;
  openFriendsModal: () => void;
  onActivityDeleted?: () => void;
}

export default function PersonalDashboard({
  selectedMonth,
  selectedYear,
  activities,
  openNewActivityModal,
  onEditActivity,
  openFriendsModal,
  onActivityDeleted,
}: PersonalDashboardProps) {
  const { user, profile, activeUserGoals } = useAuth();

  const monthObj = MONTHS.find((m) => m.value === selectedMonth) || MONTHS[0];

  // Calculate monthly totals
  const totalPullUps = activities.reduce((acc, a) => acc + (a.pullUps || 0), 0);
  const totalPushUps = activities.reduce((acc, a) => acc + (a.pushUps || 0), 0);
  const totalSitUps = activities.reduce((acc, a) => acc + (a.sitUps || 0), 0);
  const totalRunningKm = Math.round(activities.reduce((acc, a) => acc + (a.runningKm || 0), 0) * 100) / 100;

  // Percentages toward monthly goals
  const pctPullUps = Math.min(100, Math.round((totalPullUps / (activeUserGoals.pullUps || 1)) * 100));
  const pctPushUps = Math.min(100, Math.round((totalPushUps / (activeUserGoals.pushUps || 1)) * 100));
  const pctSitUps = Math.min(100, Math.round((totalSitUps / (activeUserGoals.sitUps || 1)) * 100));
  const pctRunningKm = Math.min(100, Math.round((totalRunningKm / (activeUserGoals.runningKm || 1)) * 100));

  // Overall average completion
  const averagePct = Math.round((pctPullUps + pctPushUps + pctSitUps + pctRunningKm) / 4);

  // Active workout days
  const uniqueDays = new Set(activities.map((a) => a.date)).size;

  const handleDelete = async (activity: ActivityLog) => {
    if (!user || !activity.id) return;
    if (window.confirm(`Deseja excluir o registro do dia ${activity.date}?`)) {
      try {
        await removeActivity(
          activity.id,
          user.id,
          profile?.displayName || 'Atleta',
          activity.date
        );
        if (onActivityDeleted) onActivityDeleted();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Privacy Notice Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950/70 border border-indigo-500/30 rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-lg shadow-indigo-950/20">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white">Área Privada do Atleta</h2>
              <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Privado
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 leading-snug">
              Seus treinos são 100% privados. Para comparar no ranking com amigos, eles precisam ser conectados e aceitos.
            </p>
          </div>
        </div>
        <button
          onClick={openFriendsModal}
          className="self-end sm:self-auto shrink-0 text-xs font-semibold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-all hover:scale-[1.02]"
        >
          <span>Conexões</span>
        </button>
      </div>

      {/* Main Goal Cards Grid (2x2 on mobile, 4 in a row on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* 1. Barra Fixa */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 hover:border-blue-500/40 transition shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-blue-400 flex items-center gap-1 uppercase tracking-tight sm:tracking-wide truncate">
              🏋️ Barra Fixa
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400">
              {activeUserGoals.pullUps}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-1.5">
            <div>
              <span className="text-xl sm:text-3xl font-extrabold text-white">{totalPullUps}</span>
              <span className="text-[10px] sm:text-xs text-slate-400 ml-1 font-medium">reps</span>
            </div>
            <span className={`text-xs sm:text-sm font-bold ${pctPullUps >= 100 ? 'text-emerald-400' : 'text-blue-400'}`}>
              {pctPullUps}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2 sm:h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50 mb-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-500 shadow-sm shadow-blue-500/50"
              style={{ width: `${pctPullUps}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
            <span className="truncate">Restam: {Math.max(0, activeUserGoals.pullUps - totalPullUps)}</span>
            {pctPullUps >= 100 && (
              <span className="text-emerald-400 font-semibold flex items-center gap-0.5 shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Meta!
              </span>
            )}
          </div>
        </div>

        {/* 2. Flexões */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 hover:border-emerald-500/40 transition shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-emerald-400 flex items-center gap-1 uppercase tracking-tight sm:tracking-wide truncate">
              🤸 Flexões
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400">
              {activeUserGoals.pushUps}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-1.5">
            <div>
              <span className="text-xl sm:text-3xl font-extrabold text-white">{totalPushUps}</span>
              <span className="text-[10px] sm:text-xs text-slate-400 ml-1 font-medium">reps</span>
            </div>
            <span className={`text-xs sm:text-sm font-bold ${pctPushUps >= 100 ? 'text-emerald-400' : 'text-emerald-400'}`}>
              {pctPushUps}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2 sm:h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50 mb-2">
            <div
              className="bg-gradient-to-r from-emerald-600 to-teal-500 h-full rounded-full transition-all duration-500 shadow-sm shadow-emerald-500/50"
              style={{ width: `${pctPushUps}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
            <span className="truncate">Restam: {Math.max(0, activeUserGoals.pushUps - totalPushUps)}</span>
            {pctPushUps >= 100 && (
              <span className="text-emerald-400 font-semibold flex items-center gap-0.5 shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Meta!
              </span>
            )}
          </div>
        </div>

        {/* 3. Abdominais */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 hover:border-cyan-500/40 transition shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-cyan-400 flex items-center gap-1 uppercase tracking-tight sm:tracking-wide truncate">
              🧘 Abdominais
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400">
              {activeUserGoals.sitUps}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-1.5">
            <div>
              <span className="text-xl sm:text-3xl font-extrabold text-white">{totalSitUps}</span>
              <span className="text-[10px] sm:text-xs text-slate-400 ml-1 font-medium">reps</span>
            </div>
            <span className={`text-xs sm:text-sm font-bold ${pctSitUps >= 100 ? 'text-emerald-400' : 'text-cyan-400'}`}>
              {pctSitUps}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2 sm:h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50 mb-2">
            <div
              className="bg-gradient-to-r from-cyan-600 to-blue-500 h-full rounded-full transition-all duration-500 shadow-sm shadow-cyan-500/50"
              style={{ width: `${pctSitUps}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
            <span className="truncate">Restam: {Math.max(0, activeUserGoals.sitUps - totalSitUps)}</span>
            {pctSitUps >= 100 && (
              <span className="text-emerald-400 font-semibold flex items-center gap-0.5 shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Meta!
              </span>
            )}
          </div>
        </div>

        {/* 4. Corrida (KM) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 hover:border-orange-500/40 transition shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-orange-400 flex items-center gap-1 uppercase tracking-tight sm:tracking-wide truncate">
              🏃 Corrida (KM)
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-slate-400">
              {activeUserGoals.runningKm}k
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-1.5">
            <div>
              <span className="text-xl sm:text-3xl font-extrabold text-white">{totalRunningKm}</span>
              <span className="text-[10px] sm:text-xs text-slate-400 ml-1 font-medium">km</span>
            </div>
            <span className={`text-xs sm:text-sm font-bold ${pctRunningKm >= 100 ? 'text-emerald-400' : 'text-orange-400'}`}>
              {pctRunningKm}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2 sm:h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50 mb-2">
            <div
              className="bg-gradient-to-r from-orange-600 to-amber-500 h-full rounded-full transition-all duration-500 shadow-sm shadow-orange-500/50"
              style={{ width: `${pctRunningKm}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/80">
            <span className="truncate">Restam: {Math.max(0, Math.round((activeUserGoals.runningKm - totalRunningKm) * 10) / 10)}k</span>
            {pctRunningKm >= 100 && (
              <span className="text-emerald-400 font-semibold flex items-center gap-0.5 shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Meta!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-800 text-center">
        <div className="p-1 sm:p-2">
          <p className="text-[10px] sm:text-xs text-slate-400 mb-0.5 sm:mb-1">Média do Mês</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-400">{averagePct}%</p>
        </div>
        <div className="p-1 sm:p-2 border-l border-slate-800">
          <p className="text-[10px] sm:text-xs text-slate-400 mb-0.5 sm:mb-1">Dias Ativos</p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400">{uniqueDays} dias</p>
        </div>
        <div className="p-1 sm:p-2 border-t sm:border-t-0 sm:border-l border-slate-800">
          <p className="text-[10px] sm:text-xs text-slate-400 mb-0.5 sm:mb-1">Repetições</p>
          <p className="text-xl sm:text-2xl font-bold text-cyan-400">{totalPullUps + totalPushUps + totalSitUps}</p>
        </div>
        <div className="p-1 sm:p-2 border-t sm:border-t-0 border-l border-slate-800">
          <p className="text-[10px] sm:text-xs text-slate-400 mb-0.5 sm:mb-1">Distância</p>
          <p className="text-xl sm:text-2xl font-bold text-orange-400">{totalRunningKm} km</p>
        </div>
      </div>

      {/* Workout History: Responsive Card list for Mobile + Table for Desktop */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
          <div>
            <h3 className="text-sm sm:text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              <span>Histórico ({activities.length})</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              {monthObj.label} / {selectedYear}
            </p>
          </div>
          <button
            onClick={openNewActivityModal}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl transition shadow shadow-blue-600/20"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Treino</span>
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-850/50">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto mb-2 border border-blue-500/20">
              <Dumbbell className="w-5 h-5" />
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-white mb-1">Nenhum treino registrado neste mês</h4>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto mb-3">
              Informe suas repetições de barra, flexão, abdominal ou corrida para acompanhar o progresso!
            </p>
            <button
              onClick={openNewActivityModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Treino</span>
            </button>
          </div>
        ) : (
          <>
            {/* MOBILE CARD VIEW (Phones < 640px) */}
            <div className="sm:hidden space-y-2.5">
              {activities.map((act) => {
                const [y, m, d] = act.date.split('-');
                const formattedDate = `${d}/${m}/${y}`;
                return (
                  <div key={act.id} className="bg-slate-850 p-3 rounded-xl border border-slate-800 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-400" />
                        {formattedDate}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditActivity(act)}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-750 transition"
                          title="Editar treino"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(act)}
                          className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                          title="Excluir treino"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 text-center bg-slate-900/70 p-2 rounded-lg text-xs font-semibold">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-normal">Barra</span>
                        <span className="text-blue-400 font-bold">{act.pullUps > 0 ? act.pullUps : '-'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-normal">Flexão</span>
                        <span className="text-emerald-400 font-bold">{act.pushUps > 0 ? act.pushUps : '-'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-normal">Abdom.</span>
                        <span className="text-cyan-400 font-bold">{act.sitUps > 0 ? act.sitUps : '-'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-normal">Corrida</span>
                        <span className="text-orange-400 font-bold">{act.runningKm > 0 ? `${act.runningKm}k` : '-'}</span>
                      </div>
                    </div>

                    {act.notes && (
                      <p className="text-[11px] text-slate-400 truncate italic px-0.5">
                        "{act.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW (>= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Data</th>
                    <th className="py-3 px-3 text-center">🏋️ Barra Fixa</th>
                    <th className="py-3 px-3 text-center">🤸 Flexões</th>
                    <th className="py-3 px-3 text-center">🧘 Abdominais</th>
                    <th className="py-3 px-3 text-center">🏃 Corrida (KM)</th>
                    <th className="py-3 px-3">Observações</th>
                    <th className="py-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                  {activities.map((act) => {
                    const [y, m, d] = act.date.split('-');
                    const formattedDate = `${d}/${m}/${y}`;
                    return (
                      <tr key={act.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 whitespace-nowrap text-white font-semibold">
                          {formattedDate}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-blue-400">
                          {act.pullUps > 0 ? act.pullUps : '-'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-400">
                          {act.pushUps > 0 ? act.pushUps : '-'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-cyan-400">
                          {act.sitUps > 0 ? act.sitUps : '-'}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-orange-400">
                          {act.runningKm > 0 ? `${act.runningKm} km` : '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-400 max-w-[200px] truncate text-[11px]">
                          {act.notes || <span className="text-slate-600">-</span>}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onEditActivity(act)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                              title="Editar treino"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(act)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                              title="Excluir treino"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
