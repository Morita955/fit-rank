import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '../firebase/authContext';
import { saveActivity } from '../firebase/workoutService';
import { ActivityLog } from '../types';
import {
  Calendar,
  CheckCircle2,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  Sparkles,
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
  const { user, profile } = useAuth();

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

      // Trigger celebratory confetti
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
      setError(err?.message || 'Erro ao registrar treino. Verifique suas conexões.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-white">
                {editingActivity ? 'Editar Atividade' : 'Informar Atividade do Dia'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Seus dados são 100% privados até conexão com amigos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 overscroll-contain">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Date Picker & Quick Shortcuts */}
          <div className="bg-slate-800/40 p-3 sm:p-3.5 rounded-xl border border-slate-700/60 space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-400" />
              Data do Treino
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={setToday}
                className={`text-xs px-3 py-2 rounded-lg border font-semibold transition touch-manipulation shrink-0 ${
                  date === todayStr
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={setYesterday}
                className="text-xs px-3 py-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 font-semibold transition touch-manipulation shrink-0"
              >
                Ontem
              </button>
            </div>
          </div>

          {/* 4 Exercise Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
            {/* 1. Barra Fixa */}
            <div className="bg-slate-800/60 p-3 sm:p-3.5 rounded-xl border border-slate-700 hover:border-blue-500/50 transition">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-blue-300 flex items-center gap-1">
                  🏋️ Barra Fixa
                </span>
                <span className="text-[10px] text-slate-400">Meta: 200/mês</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="1000"
                  value={pullUps === 0 ? '' : pullUps}
                  onChange={(e) => setPullUps(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 sm:py-2 text-base font-bold text-white focus:outline-none focus:border-blue-500"
                />
                <span className="text-xs text-slate-400 font-medium">reps</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 5, 10, 20].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAdd(setPullUps, amt)}
                    className="flex-1 py-1.5 sm:py-1 text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 active:bg-blue-500/30 text-blue-300 rounded border border-blue-500/20 transition touch-manipulation"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Flexões */}
            <div className="bg-slate-800/60 p-3 sm:p-3.5 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                  🤸 Flexões
                </span>
                <span className="text-[10px] text-slate-400">Meta: 1000/mês</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="2000"
                  value={pushUps === 0 ? '' : pushUps}
                  onChange={(e) => setPushUps(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 sm:py-2 text-base font-bold text-white focus:outline-none focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 font-medium">reps</span>
              </div>
              <div className="flex gap-1.5">
                {[5, 10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAdd(setPushUps, amt)}
                    className="flex-1 py-1.5 sm:py-1 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 text-emerald-300 rounded border border-emerald-500/20 transition touch-manipulation"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Abdominais */}
            <div className="bg-slate-800/60 p-3 sm:p-3.5 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                  🧘 Abdominais
                </span>
                <span className="text-[10px] text-slate-400">Meta: 500/mês</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="2000"
                  value={sitUps === 0 ? '' : sitUps}
                  onChange={(e) => setSitUps(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 sm:py-2 text-base font-bold text-white focus:outline-none focus:border-cyan-500"
                />
                <span className="text-xs text-slate-400 font-medium">reps</span>
              </div>
              <div className="flex gap-1.5">
                {[10, 25, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAdd(setSitUps, amt)}
                    className="flex-1 py-1.5 sm:py-1 text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 active:bg-cyan-500/30 text-cyan-300 rounded border border-cyan-500/20 transition touch-manipulation"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Corrida (KM) */}
            <div className="bg-slate-800/60 p-3 sm:p-3.5 rounded-xl border border-slate-700 hover:border-orange-500/50 transition">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-orange-300 flex items-center gap-1">
                  🏃 Corrida (KM)
                </span>
                <span className="text-[10px] text-slate-400">Meta: 50 km/mês</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  max="100"
                  value={runningKm === 0 ? '' : runningKm}
                  onChange={(e) => setRunningKm(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0.0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 sm:py-2 text-base font-bold text-white focus:outline-none focus:border-orange-500"
                />
                <span className="text-xs text-slate-400 font-medium">km</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2.5, 5, 10].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAdd(setRunningKm, amt)}
                    className="flex-1 py-1.5 sm:py-1 text-xs font-semibold bg-orange-500/10 hover:bg-orange-500/20 active:bg-orange-500/30 text-orange-300 rounded border border-orange-500/20 transition touch-manipulation"
                  >
                    +{amt}k
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Observações / Notas do Treino (Opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Treino de alta intensidade, 5km na praia..."
              maxLength={200}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 sm:py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 sm:flex-initial justify-center px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-50 touch-manipulation"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingActivity ? 'Atualizar Treino' : 'Salvar Atividade'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
