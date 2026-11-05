import React, { useState } from 'react';
import { useAuth } from '../firebase/authContext';
import { DEFAULT_GOALS, MonthlyGoals } from '../types';
import { Camera, Check, Image as ImageIcon, Settings, User, X } from 'lucide-react';

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoalsModal({ isOpen, onClose }: GoalsModalProps) {
  const { profile, updateUserGoals, updateDisplayName, updateProfilePhoto, activeUserGoals } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [pullUps, setPullUps] = useState(activeUserGoals.pullUps);
  const [pushUps, setPushUps] = useState(activeUserGoals.pushUps);
  const [sitUps, setSitUps] = useState(activeUserGoals.sitUps);
  const [runningKm, setRunningKm] = useState(activeUserGoals.runningKm);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setPhotoURL(profile.photoURL || '');
      setPullUps(activeUserGoals.pullUps);
      setPushUps(activeUserGoals.pushUps);
      setSitUps(activeUserGoals.sitUps);
      setRunningKm(activeUserGoals.runningKm);
    }
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (displayName.trim() && displayName !== profile?.displayName) {
        await updateDisplayName(displayName.trim());
      }
      if (photoURL !== profile?.photoURL) {
        await updateProfilePhoto(photoURL.trim());
      }
      await updateUserGoals({
        pullUps: Number(pullUps) || DEFAULT_GOALS.pullUps,
        pushUps: Number(pushUps) || DEFAULT_GOALS.pushUps,
        sitUps: Number(sitUps) || DEFAULT_GOALS.sitUps,
        runningKm: Number(runningKm) || DEFAULT_GOALS.runningKm,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDefaults = () => {
    setPullUps(DEFAULT_GOALS.pullUps);
    setPushUps(DEFAULT_GOALS.pushUps);
    setSitUps(DEFAULT_GOALS.sitUps);
    setRunningKm(DEFAULT_GOALS.runningKm);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">Configurar Perfil & Metas</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Atualize sua foto, nome e metas pessoais</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {/* Avatar Preview & Upload */}
          <div className="flex flex-col items-center gap-3 bg-slate-850 p-4 rounded-2xl border border-slate-800">
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-600/30 border-2 border-blue-500/40 flex items-center justify-center text-white font-extrabold text-2xl shadow-md">
                {photoURL ? (
                  <img src={photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{displayName?.[0]?.toUpperCase() || 'A'}</span>
                )}
              </div>
              <label className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl shadow cursor-pointer transition">
                <Camera className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Toque no ícone de câmera para enviar foto</span>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Seu Nome de Atleta
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Foto de Perfil (URL da Imagem)
            </label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="url"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Metas Mensais Pessoais
              </span>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="text-[11px] text-blue-400 hover:underline"
              >
                Padrão da Planilha
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-850 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs font-medium text-blue-300">🏋️ Barra Fixa</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="10000"
                    value={pullUps}
                    onChange={(e) => setPullUps(parseInt(e.target.value) || 0)}
                    className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-bold text-right"
                  />
                  <span className="text-xs text-slate-400">reps</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-850 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs font-medium text-emerald-300">🤸 Flexões</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="20000"
                    value={pushUps}
                    onChange={(e) => setPushUps(parseInt(e.target.value) || 0)}
                    className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-bold text-right"
                  />
                  <span className="text-xs text-slate-400">reps</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-850 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs font-medium text-cyan-300">🧘 Abdominais</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    max="20000"
                    value={sitUps}
                    onChange={(e) => setSitUps(parseInt(e.target.value) || 0)}
                    className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-bold text-right"
                  />
                  <span className="text-xs text-slate-400">reps</span>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-850 p-2.5 rounded-xl border border-slate-800">
                <span className="text-xs font-medium text-orange-300">🏃 Corrida</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.5"
                    min="1"
                    max="1000"
                    value={runningKm}
                    onChange={(e) => setRunningKm(parseFloat(e.target.value) || 0)}
                    className="w-20 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-bold text-right"
                  />
                  <span className="text-xs text-slate-400">km</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
