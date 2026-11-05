import React, { useState } from 'react';
import { useAuth } from '../firebase/authContext';
import { DEFAULT_GOALS, MonthlyGoals } from '../types';
import {
  Activity,
  Award,
  Bell,
  CheckCircle2,
  ChevronDown,
  Dumbbell,
  FileSpreadsheet,
  Flame,
  LogOut,
  Plus,
  Settings,
  User as UserIcon,
  Users,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'ranking' | 'spreadsheet';
  setActiveTab: (tab: 'dashboard' | 'ranking' | 'spreadsheet') => void;
  openNewActivityModal: () => void;
  openFriendsModal: () => void;
  openGoalsModal: () => void;
  openSpreadsheetModal: () => void;
  openVerifyEmailModal: () => void;
  selectedMonth: number;
  setSelectedMonth: (month: number) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  pendingInvitesCount: number;
}

export const MONTHS = [
  { value: 1, label: 'Janeiro' },
  { value: 2, label: 'Fevereiro' },
  { value: 3, label: 'Março' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Maio' },
  { value: 6, label: 'Junho' },
  { value: 7, label: 'Julho' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Setembro' },
  { value: 10, label: 'Outubro' },
  { value: 11, label: 'Novembro' },
  { value: 12, label: 'Dezembro' },
];

export default function Navbar({
  activeTab,
  setActiveTab,
  openNewActivityModal,
  openFriendsModal,
  openGoalsModal,
  openSpreadsheetModal,
  openVerifyEmailModal,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  pendingInvitesCount,
}: NavbarProps) {
  const { user, profile, logout, activeUserGoals } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-lg">
      {/* Email Unverified Warning Alert Banner */}
      {user && user.emailVerified === false && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 py-1.5 px-3 sm:px-4 text-[11px] sm:text-xs text-amber-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-amber-400 font-bold shrink-0">⚠️ Pendente:</span>
            <span className="truncate">Confirme seu e-mail para ativar sua conta.</span>
          </div>
          <button
            onClick={openVerifyEmailModal}
            className="text-[10px] sm:text-[11px] font-bold text-amber-300 hover:text-white bg-amber-500/25 px-2 py-0.5 rounded border border-amber-500/40 transition shrink-0"
          >
            Confirmar
          </button>
        </div>
      )}

      {/* Top Banner: META MENSAL (Faithful to spreadsheet header, touch-friendly scroll on mobile) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-900 py-1 px-3 sm:px-4 border-b border-blue-800/40 text-xs text-blue-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 max-w-full">
          <div className="flex items-center gap-1 font-semibold text-blue-200 shrink-0">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="uppercase text-[10px] sm:text-[11px] font-bold hidden sm:inline">Meta Mensal:</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 font-mono text-[10px] sm:text-xs shrink-0">
            <div className="flex items-center gap-1 bg-blue-950/90 px-1.5 sm:px-2 py-0.5 rounded border border-blue-700/50">
              <span className="text-slate-400">BARRA:</span>
              <span className="font-bold text-amber-300">{activeUserGoals.pullUps}</span>
            </div>
            <div className="flex items-center gap-1 bg-blue-950/90 px-1.5 sm:px-2 py-0.5 rounded border border-blue-700/50">
              <span className="text-slate-400">FLEXÃO:</span>
              <span className="font-bold text-emerald-300">{activeUserGoals.pushUps}</span>
            </div>
            <div className="flex items-center gap-1 bg-blue-950/90 px-1.5 sm:px-2 py-0.5 rounded border border-blue-700/50">
              <span className="text-slate-400">ABDOM:</span>
              <span className="font-bold text-cyan-300">{activeUserGoals.sitUps}</span>
            </div>
            <div className="flex items-center gap-1 bg-blue-950/90 px-1.5 sm:px-2 py-0.5 rounded border border-blue-700/50">
              <span className="text-slate-400">CORRIDA:</span>
              <span className="font-bold text-orange-300">{activeUserGoals.runningKm}k</span>
            </div>
          </div>
        </div>

        <button
          onClick={openGoalsModal}
          className="text-[10px] sm:text-[11px] text-blue-300 hover:text-white underline decoration-dotted flex items-center gap-1 shrink-0 ml-1"
          title="Editar metas pessoais"
        >
          <Settings className="w-3 h-3" />
          <span className="hidden sm:inline">Metas</span>
        </button>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="bg-gradient-to-tr from-blue-600 to-indigo-500 p-1.5 sm:p-2 rounded-xl shadow-md shadow-blue-500/20">
              <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
                FitRank
              </span>
            </div>
          </div>

          {/* Month / Year Selector */}
          <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-lg border border-slate-700 text-xs sm:text-sm">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer py-0.5 px-1 sm:px-1.5 rounded hover:bg-slate-700/50"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value} className="bg-slate-800 text-white">
                  {m.label.slice(0, 3)}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-slate-200 font-medium focus:outline-none cursor-pointer py-0.5 px-1 sm:px-1.5 rounded hover:bg-slate-700/50"
            >
              <option value={2025} className="bg-slate-800 text-white">2025</option>
              <option value={2026} className="bg-slate-800 text-white">2026</option>
              <option value={2027} className="bg-slate-800 text-white">2027</option>
            </select>
          </div>

          {/* Actions & User menu */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* New Activity Button (Desktop & Tablet) */}
            <button
              onClick={openNewActivityModal}
              className="hidden sm:flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 sm:py-2 rounded-xl shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Treino</span>
            </button>

            {/* Friend Invites / Connections button (Desktop) */}
            <button
              onClick={openFriendsModal}
              className="hidden sm:flex relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Amigos & Solicitações"
            >
              <Users className="w-4 h-4" />
              {pendingInvitesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-900 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-bounce shadow">
                  {pendingInvitesCount}
                </span>
              )}
            </button>

            {/* User Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs uppercase border border-blue-500/30">
                  {profile?.displayName?.[0] || user?.email?.[0] || 'A'}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-1 text-xs text-slate-300 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-700">
                    <p className="font-semibold text-white truncate">{profile?.displayName || 'Atleta'}</p>
                    <p className="text-[11px] text-slate-400 truncate mb-1">{user?.email}</p>
                    {user?.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-semibold">
                        <CheckCircle2 className="w-2.5 h-2.5" /> E-mail Verificado
                      </span>
                    ) : (
                      <button
                        onClick={openVerifyEmailModal}
                        className="w-full text-left inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 font-semibold transition"
                      >
                        ⚠️ Confirmar E-mail
                      </button>
                    )}
                  </div>
                  <button
                    onClick={openGoalsModal}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Configurar Metas Pessoais</span>
                  </button>
                  <button
                    onClick={openFriendsModal}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>Conexões ({pendingInvitesCount} pendentes)</span>
                  </button>
                  <button
                    onClick={openSpreadsheetModal}
                    className="w-full text-left px-3 py-2 hover:bg-slate-700 flex items-center gap-2 text-emerald-400"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Planilha Original</span>
                  </button>
                  <div className="border-t border-slate-700 my-1"></div>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sair da Conta</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Tab Navigation */}
        <div className="hidden sm:flex border-t border-slate-800/80 -mb-px">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 py-2.5 px-4 border-b-2 font-medium text-xs sm:text-sm transition ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Meu Progresso (Privado)</span>
          </button>

          <button
            onClick={() => setActiveTab('ranking')}
            className={`flex items-center gap-2 py-2.5 px-4 border-b-2 font-medium text-xs sm:text-sm transition relative ${
              activeTab === 'ranking'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Ranking & Desafio dos Amigos</span>
          </button>

          <button
            onClick={openSpreadsheetModal}
            className="flex items-center gap-2 py-2.5 px-4 border-b-2 border-transparent text-slate-400 hover:text-emerald-400 text-xs sm:text-sm transition ml-auto"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Planilha</span>
          </button>
        </div>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom on phones, native app feel) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 flex items-center justify-around py-1.5 px-2 text-[10px] font-semibold shadow-2xl safe-area-pb">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition ${
            activeTab === 'dashboard' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span>Meu Painel</span>
        </button>

        <button
          onClick={() => setActiveTab('ranking')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition ${
            activeTab === 'ranking' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Award className="w-5 h-5" />
          <span>Ranking</span>
        </button>

        {/* Center Floating Plus Button for Daily Workout */}
        <button
          onClick={openNewActivityModal}
          className="flex flex-col items-center -mt-5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-3 rounded-full shadow-lg shadow-blue-600/40 border-2 border-slate-900 active:scale-95 transition"
          title="Registrar Treino"
        >
          <Plus className="w-5 h-5" />
        </button>

        <button
          onClick={openFriendsModal}
          className="flex flex-col items-center gap-1 p-1.5 rounded-lg text-slate-400 hover:text-white transition relative"
        >
          <Users className="w-5 h-5" />
          <span>Amigos</span>
          {pendingInvitesCount > 0 && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400"></span>
          )}
        </button>

        <button
          onClick={openSpreadsheetModal}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition touch-manipulation ${
            activeTab === 'spreadsheet' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-emerald-400'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>Planilha</span>
        </button>
      </nav>
    </header>
  );
}
