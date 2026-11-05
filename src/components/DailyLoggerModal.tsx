import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../firebase/authContext';
import { saveActivity } from '../firebase/workoutService';
import { ActivityLog } from '../types';
import {
  Calendar,
  CheckCircle2,
  Dumbbell,
  TrendingUp,
  X,
} from 'lucide-react';

interface DailyLoggerModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingActivity?: ActivityLog | null;
  onSaved?: () => void;
}

export default function DailyLoggerModal({
  isOpen,
  onClose,
  editingActivity,
  onSaved,
}: DailyLoggerModalProps) {
  const { user, profile, activeUserGoals } = useAuth();

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState<string>(editingActivity?.date || todayStr);
  const [pullUps, setPullUps] = useState<number>(editingActivity?.pullUps || 0);
  const [pushUps, setPushUps] = useState<number>(editingActivity?.pushUps || 0);
  const [sitUps, setSitUps] = useState<number>(editingActivity?.sitUps || 0);
  const [runningKm, setRunningKm] = useState<number>(editingActivity?.runningKm || 0);
  const [notes, setNotes] = useState<string>(editingActivity?.notes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync if editing changes
  React.useEffect(() => {
    if (editingActivity) {
      setDate(editingActivity.date);
      setPullUps(editingActivity.pullUps || 0);
      setPushUps(editingActivity.pushUps || 0);
      setSitUps(editingActivity.sitUps || 0);
      setRunningKm(editingActivity.runningKm || 0);
      setNotes(editingActivity.notes || '');
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setPullUps(0);
      setPushUps(0);
      setSitUps(0);
      setRunningKm(0);
      setNotes('');
    }
    setError(null);
  }, [editingActivity, isOpen]);

  if (!isOpen) return null;

  const handleQuickAdd = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    amount: number
  ) => {
    setter((prev) => Math.max(0, Math.round((prev + amount) * 100) / 100));
  };

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setDate(d.toISOString().split('T')[0]);
  };

  const setToday = () => {
    setDate(new Date().toISOString().split('T')[0]);
  };

  // Approximate impact calculation for the top banner
  const impactScore = Math.round(
    ((pullUps / (activeUserGoals.pullUps || 200)) * 25 +
     (pushUps / (activeUserGoals.pushUps || 1000)) * 25 +
     (sitUps / (activeUserGoals.sitUps || 500)) * 25 +
     (runningKm / (activeUserGoals.runningKm || 50)) * 25) * 10
  ) / 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (pullUps === 0 && pushUps === 0 && sitUps === 0 && runningKm === 0) {
      setError('Por favor, informe ao menos uma atividade feita no dia.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await saveActivity(
        user.uid,
        profile?.displayName || user.email?.split('@')[0] || 'Atleta',
        {
          date,
          pullUps: Number(pullUps) || 0,
          pushUps: Number(pushUps) || 0,
          sitUps: Number(sitUps) || 0,
          runningKm: Number(runningKm) || 0,
          notes,
        },
        editingActivity?.id
      );

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#2563eb', '#10b981', '#f59e0b', '#ec4899'],
      });

      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erro ao registrar treino.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[96dvh] sm:max-h-[92vh]">
        {/* Header (Removed non-functional gear icon) */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              aria-label="Voltar"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base sm:text-xl font-black tracking-wide text-white">
              {editingActivity ? 'Editar Registro' : 'Novo Registro'}
            </h3>
          </div>
        </div>

        {/* Sticky Impact Banner at Top */}
        <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-slate-800 shadow-md">
          <div className="bg-slate-850 p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-lime-400" />
                Impacto na Meta Mensal
              </span>
              <span className="text-base sm:text-lg font-black text-lime-400 font-mono">
                +{impactScore}%
              </span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-gradient-to-r from-lime-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, impactScore * 5)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Evolução diária</span>
              <span className="font-bold text-slate-300">Progresso do Mês</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 overscroll-contain">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Date Selector (Clean, larger font) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-blue-400" />
              Data do Treino
            </label>
            <div className="flex items-center gap-2.5">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="bg-slate-850 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm sm:text-base font-semibold text-white focus:outline-none focus:border-blue-500 flex-1"
              />
              <button
                type="button"
                onClick={setToday}
                className={`text-xs sm:text-sm px-4 py-2.5 rounded-xl font-bold transition ${
                  date === todayStr ? 'bg-blue-600 text-white shadow' : 'bg-slate-850 text-slate-300 border border-slate-700'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={setYesterday}
                className="text-xs sm:text-sm px-4 py-2.5 rounded-xl font-bold bg-slate-850 text-slate-300 border border-slate-700 hover:bg-slate-800"
              >
                Ontem
              </button>
            </div>
          </div>

          {/* 4 Exercise Cards (Larger font sizes and touch targets) */}
          <div className="space-y-4">
            {/* 1. Barra Fixa */}
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-blue-500/40 transition">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    🏋️ Barra Fixa
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 tracking-wide font-semibold uppercase mt-0.5">
                    Força Dorsal & Pegada
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">Meta Diária</span>
                  <span className="text-xs sm:text-sm font-black text-lime-400 font-mono">
                    {Math.round((activeUserGoals.pullUps / 28))} reps
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="1000"
                  value={pullUps === 0 ? '' : pullUps}
                  onChange={(e) => setPullUps(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-28 bg-transparent text-2xl sm:text-3xl font-black text-white text-center focus:outline-none font-mono"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">reps</span>
                <div className="flex gap-2 ml-auto">
                  {[1, 5, 10, 20].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAdd(setPullUps, amt)}
                      className="px-3 py-2 text-xs sm:text-sm font-black bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-xl border border-blue-500/30 transition active:scale-95 touch-manipulation"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Flexões */}
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-emerald-500/40 transition">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    🤸 Flexões
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 tracking-wide font-semibold uppercase mt-0.5">
                    Peitoral, Tríceps & Core
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">Meta Diária</span>
                  <span className="text-xs sm:text-sm font-black text-cyan-400 font-mono">
                    {Math.round((activeUserGoals.pushUps / 28))} reps
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="2000"
                  value={pushUps === 0 ? '' : pushUps}
                  onChange={(e) => setPushUps(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-28 bg-transparent text-2xl sm:text-3xl font-black text-white text-center focus:outline-none font-mono"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">reps</span>
                <div className="flex gap-2 ml-auto">
                  {[5, 10, 25].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAdd(setPushUps, amt)}
                      className="px-3 py-2 text-xs sm:text-sm font-black bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl border border-emerald-500/30 transition active:scale-95 touch-manipulation"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Abdominais */}
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-cyan-500/40 transition">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    🧘 Abdominais
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 tracking-wide font-semibold uppercase mt-0.5">
                    Estabilidade & Lombar
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">Meta Diária</span>
                  <span className="text-xs sm:text-sm font-black text-slate-300 font-mono">
                    {Math.round((activeUserGoals.sitUps / 28))} reps
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="2000"
                  value={sitUps === 0 ? '' : sitUps}
                  onChange={(e) => setSitUps(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-28 bg-transparent text-2xl sm:text-3xl font-black text-white text-center focus:outline-none font-mono"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">reps</span>
                <div className="flex gap-2 ml-auto">
                  {[10, 25, 50].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAdd(setSitUps, amt)}
                      className="px-3 py-2 text-xs sm:text-sm font-black bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 rounded-xl border border-cyan-500/30 transition active:scale-95 touch-manipulation"
                    >
                      +{amt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Corrida (KM) */}
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-orange-500/40 transition">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    🏃 Corrida (KM)
                  </h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 tracking-wide font-semibold uppercase mt-0.5">
                    Cardio & Resistência Aeróbica
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800 text-[11px] font-bold text-orange-400">
                  <span>GPS / Strava</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  max="100"
                  value={runningKm === 0 ? '' : runningKm}
                  onChange={(e) => setRunningKm(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0.0"
                  className="w-28 bg-transparent text-2xl sm:text-3xl font-black text-white text-center focus:outline-none font-mono"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-wider">km</span>
                <div className="flex gap-2 ml-auto">
                  {[1, 2.5, 5].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickAdd(setRunningKm, amt)}
                      className="px-3 py-2 text-xs sm:text-sm font-black bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 rounded-xl border border-orange-500/30 transition active:scale-95 touch-manipulation"
                    >
                      +{amt}k
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs sm:text-sm font-semibold text-slate-300 block mb-1.5">
              Observações / Notas do Treino (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Treino de alta intensidade..."
              maxLength={200}
              className="w-full bg-slate-850 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-base shadow-xl shadow-blue-600/30 transition active:scale-[0.99] disabled:opacity-50 touch-manipulation"
            >
              {loading ? 'Salvando...' : editingActivity ? 'Atualizar Atividade' : 'Salvar Registro de Treino'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
