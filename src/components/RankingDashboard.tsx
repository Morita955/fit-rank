import React, { useEffect, useState } from 'react';
import { useAuth } from '../firebase/authContext';
import {
  getMonthRankingData,
  getMultiMonthSpreadsheetData,
  MultiMonthAthleteHistory,
} from '../firebase/workoutService';
import {
  AthleteProgressSummary,
  DEFAULT_GOALS,
  FriendConnection,
  MonthlyGoals,
  USER_COLORS,
} from '../types';
import { MONTHS } from './Navbar';
import {
  Activity,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Crown,
  Dumbbell,
  Eye,
  Flame,
  Footprints,
  Info,
  Medal,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  UserCheck,
  Users,
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
  const [multiMonthData, setMultiMonthData] = useState<MultiMonthAthleteHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [exerciseFilter, setExerciseFilter] = useState<ExerciseFilter>('geral');
  const [chartViewMode, setChartViewMode] = useState<'stacked' | 'single' | 'month_focus'>('stacked');
  const [activeChart, setActiveChart] = useState<ExerciseFilter>('pullUps');

  const monthObj = MONTHS.find((m) => m.value === selectedMonth) || MONTHS[0];
  const acceptedFriendsCount = connections.filter((c) => c.status === 'accepted').length;

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedMonth, selectedYear, connections]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ranking, history] = await Promise.all([
        getMonthRankingData(
          user.uid,
          profile?.displayName || 'Atleta',
          selectedYear,
          selectedMonth,
          activeUserGoals
        ),
        getMultiMonthSpreadsheetData(
          user.uid,
          profile?.displayName || 'Atleta',
          selectedYear
        ),
      ]);
      setRankingList(ranking);
      setMultiMonthData(history);
    } catch (err) {
      console.error('Erro ao carregar dados do ranking:', err);
    } finally {
      setLoading(false);
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

  // Helper to render an SVG Line Chart fitting all 12 months perfectly on screen without horizontal scroll
  const renderSpreadsheetChart = (
    title: string,
    key: 'pullUps' | 'pushUps' | 'sitUps' | 'runningKm',
    goal: number,
    unit: string,
    accentColor: string
  ) => {
    let maxVal = goal * 1.25;
    multiMonthData.forEach((ath) => {
      ath.monthlyData.forEach((m) => {
        const val = m[key] || 0;
        if (val > maxVal) maxVal = val * 1.15;
      });
    });

    const chartHeight = 220;
    const chartWidth = 760;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 30;
    const availableWidth = chartWidth - paddingLeft - paddingRight;
    const availableHeight = chartHeight - paddingTop - paddingBottom;

    const monthSlotWidth = availableWidth / 12;
    const goalY = paddingTop + availableHeight - (goal / maxVal) * availableHeight;

    const monthsSequence = [
      { m: 12, label: 'Dez' },
      { m: 1, label: 'Jan' },
      { m: 2, label: 'Fev' },
      { m: 3, label: 'Mar' },
      { m: 4, label: 'Abr' },
      { m: 5, label: 'Mai' },
      { m: 6, label: 'Jun' },
      { m: 7, label: 'Jul' },
      { m: 8, label: 'Ago' },
      { m: 9, label: 'Set' },
      { m: 10, label: 'Out' },
      { m: 11, label: 'Nov' },
    ];

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xl space-y-3">
        {/* Chart Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-white">
              {title}
            </span>
            <span
              className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded font-mono font-bold"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              Meta: {goal} {unit}
            </span>
          </div>

          {/* Athletes Legend */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs">
            {multiMonthData.map((ath) => (
              <div key={ath.userId} className="flex items-center gap-1 font-medium">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shadow-sm shrink-0"
                  style={{ backgroundColor: ath.color }}
                ></span>
                <span className={ath.isCurrentUser ? 'text-white font-bold' : 'text-slate-300'}>
                  {ath.userName.toUpperCase()} {ath.isCurrentUser && '(VOCÊ)'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Responsive SVG Line Chart */}
        <div className="w-full">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto text-slate-400 font-sans select-none"
          >
            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = paddingTop + availableHeight * (1 - pct);
              const val = Math.round(maxVal * pct);
              return (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={chartWidth - paddingRight}
                    y2={y}
                    stroke="#334155"
                    strokeDasharray={idx === 0 ? 'none' : '3,3'}
                    strokeWidth={idx === 0 ? 1.5 : 0.8}
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fill="#94a3b8"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Goal Target Line */}
            {goal <= maxVal && (
              <g>
                <line
                  x1={paddingLeft}
                  y1={goalY}
                  x2={chartWidth - paddingRight}
                  y2={goalY}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                <text
                  x={chartWidth - paddingRight}
                  y={goalY - 5}
                  textAnchor="end"
                  fontSize="9"
                  fill="#f87171"
                  fontWeight="bold"
                >
                  META: {goal} {unit}
                </text>
              </g>
            )}

            {/* Month X Labels */}
            {monthsSequence.map((mSeq, mIdx) => {
              const x = paddingLeft + mIdx * monthSlotWidth + monthSlotWidth / 2;
              return (
                <text
                  key={mSeq.m}
                  x={x}
                  y={chartHeight - 8}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#94a3b8"
                  fontWeight="bold"
                >
                  {mSeq.label}
                </text>
              );
            })}

            {/* Lines and points for each athlete */}
            {multiMonthData.map((athlete) => {
              const points = monthsSequence.map((mSeq, mIdx) => {
                const mData = athlete.monthlyData.find((d) => d.month === mSeq.m);
                const val = mData ? mData[key] : 0;
                const x = paddingLeft + mIdx * monthSlotWidth + monthSlotWidth / 2;
                const y = paddingTop + availableHeight - (val / maxVal) * availableHeight;
                return { x, y, val, label: mSeq.label };
              });

              const pathString = points.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');

              return (
                <g key={athlete.userId}>
                  <path
                    d={pathString}
                    fill="none"
                    stroke={athlete.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {points.map((p, idx) => (
                    <g key={idx}>
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={athlete.isCurrentUser ? '4' : '3'}
                        fill={athlete.color}
                        stroke="#0f172a"
                        strokeWidth="1.5"
                      >
                        <title>{`${athlete.userName} (${p.label}): ${p.val} ${unit}`}</title>
                      </circle>
                    </g>
                  ))}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  const renderMonthFocusComparison = () => {
    const exercises: {
      key: 'pullUps' | 'pushUps' | 'sitUps' | 'runningKm';
      label: string;
      goal: number;
      unit: string;
      color: string;
      icon: string;
    }[] = [
      { key: 'pullUps', label: 'Barra Fixa', goal: activeUserGoals.pullUps || 200, unit: 'reps', color: '#2563eb', icon: '🏋️' },
      { key: 'pushUps', label: 'Flexões', goal: activeUserGoals.pushUps || 1000, unit: 'reps', color: '#10b981', icon: '🤸' },
      { key: 'sitUps', label: 'Abdominais', goal: activeUserGoals.sitUps || 500, unit: 'reps', color: '#06b6d4', icon: '🧘' },
      { key: 'runningKm', label: 'Corrida (KM)', goal: activeUserGoals.runningKm || 50, unit: 'km', color: '#f97316', icon: '🏃' },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 animate-in fade-in duration-150">
        {exercises.map((ex) => {
          const sorted = [...rankingList].sort((a, b) => (b[ex.key] as number) - (a[ex.key] as number));

          return (
            <div key={ex.key} className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-white text-xs sm:text-sm">
                  <span>{ex.icon}</span>
                  <span>{ex.label}</span>
                </div>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Meta: {ex.goal} {ex.unit}
                </span>
              </div>

              <div className="space-y-2">
                {sorted.map((ath, idx) => {
                  const val = ath[ex.key] as number;
                  const pct = Math.min(100, Math.round((val / ex.goal) * 100));

                  return (
                    <div
                      key={ath.userId}
                      className={`p-2.5 rounded-xl transition ${
                        ath.isCurrentUser ? 'bg-blue-600/10 border border-blue-500/25' : 'bg-slate-850/80 border border-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-[10px] font-bold text-amber-400 w-4 text-center shrink-0">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`}
                          </span>
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-sm"
                            style={{ backgroundColor: ath.color }}
                          ></span>
                          <span className="font-semibold text-white truncate text-xs">
                            {ath.userName} {ath.isCurrentUser && '(Você)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-bold text-white text-xs">
                            {val} <span className="text-[10px] text-slate-400 font-normal">{ex.unit}</span>
                          </span>
                          <span className={`text-[10px] font-bold ${pct >= 100 ? 'text-emerald-400' : 'text-slate-400'}`}>
                            {pct}%
                          </span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: ath.color || ex.color,
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* Mutual Acceptance Info / Status Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-xl">
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-lg font-bold text-white">Ranking dos Amigos</h2>
              <span className="text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                {acceptedFriendsCount} Atleta(s)
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-snug">
              Visualização mútua: apenas atletas mutuamente aceitos competem no seu ranking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={openFriendsModal}
            className="flex-1 sm:flex-initial text-xs font-semibold px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition flex items-center justify-center gap-1.5 shadow"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Conectar Amigos</span>
          </button>
          <button
            onClick={loadData}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700"
            title="Recarregar ranking"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter Tabs for Ranking Podium */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 max-w-full">
          <button
            onClick={() => setExerciseFilter('geral')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              exerciseFilter === 'geral'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🏆 Geral
          </button>
          <button
            onClick={() => setExerciseFilter('pullUps')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              exerciseFilter === 'pullUps'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🏋️ Barra
          </button>
          <button
            onClick={() => setExerciseFilter('pushUps')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              exerciseFilter === 'pushUps'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🤸 Flexão
          </button>
          <button
            onClick={() => setExerciseFilter('sitUps')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              exerciseFilter === 'sitUps'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🧘 Abdom.
          </button>
          <button
            onClick={() => setExerciseFilter('runningKm')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              exerciseFilter === 'runningKm'
                ? 'bg-orange-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            🏃 Corrida
          </button>
        </div>

        <div className="flex items-center gap-1 bg-slate-800 p-0.5 sm:p-1 rounded-xl border border-slate-700 text-[10px] sm:text-xs">
          <button
            onClick={() => setChartViewMode('month_focus')}
            className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg font-semibold transition touch-manipulation ${
              chartViewMode === 'month_focus'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mês Atual
          </button>
          <button
            onClick={() => setChartViewMode('stacked')}
            className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg font-semibold transition touch-manipulation ${
              chartViewMode === 'stacked'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            12 Meses
          </button>
          <button
            onClick={() => setChartViewMode('single')}
            className={`px-2 py-1 sm:px-2.5 sm:py-1 rounded-lg font-semibold transition touch-manipulation ${
              chartViewMode === 'single'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Individual
          </button>
        </div>
      </div>

      {/* Podium Cards for Top 3 */}
      {sortedRanking.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
          {sortedRanking.slice(0, 3).map((ath, index) => {
            const medals = [
              { color: 'from-amber-400 to-yellow-600', text: '1º Lugar', icon: '🥇' },
              { color: 'from-slate-300 to-slate-500', text: '2º Lugar', icon: '🥈' },
              { color: 'from-amber-700 to-orange-800', text: '3º Lugar', icon: '🥉' },
            ];
            const badge = medals[index];

            return (
              <div
                key={ath.userId}
                className={`bg-slate-900 border rounded-2xl p-3 sm:p-5 relative overflow-hidden transition hover:scale-[1.01] ${
                  index === 0
                    ? 'border-amber-500/40 shadow-lg shadow-amber-500/10'
                    : 'border-slate-800 shadow-md'
                }`}
              >
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                  <span className="text-lg sm:text-xl">{badge.icon}</span>
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {badge.text} - {monthObj.label}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
                  <div
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-full text-white font-extrabold flex items-center justify-center text-sm sm:text-base shadow-md shrink-0"
                    style={{ backgroundColor: ath.color }}
                  >
                    {ath.userName?.[0] || 'A'}
                  </div>
                  <div className="truncate">
                    <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-1.5 truncate">
                      {ath.userName}
                      {ath.isCurrentUser && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-normal shrink-0">
                          Você
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-400">
                      Média: <span className="font-bold text-white">{ath.averageScore}%</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1 bg-slate-850 p-2 sm:p-2.5 rounded-xl border border-slate-800 text-center text-[11px] sm:text-xs">
                  <div>
                    <p className="text-[9px] text-slate-400">Barra</p>
                    <p className="font-bold text-blue-400">{ath.pullUps}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400">Flexão</p>
                    <p className="font-bold text-emerald-400">{ath.pushUps}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400">Abdom.</p>
                    <p className="font-bold text-cyan-400">{ath.sitUps}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400">Corrida</p>
                    <p className="font-bold text-orange-400">{ath.runningKm}k</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-5 shadow-xl">
        <h3 className="text-sm sm:text-base font-bold text-white mb-3 flex items-center gap-2">
          <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          <span>Classificação - {monthObj.label} / {selectedYear}</span>
        </h3>

        <div className="sm:hidden space-y-2">
          {sortedRanking.map((ath, idx) => (
            <div
              key={ath.userId}
              className={`p-3 rounded-xl border transition ${
                ath.isCurrentUser
                  ? 'bg-blue-600/10 border-blue-500/30'
                  : 'bg-slate-850 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-amber-400 w-5 text-center">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`}
                  </span>
                  <div
                    className="w-6 h-6 rounded-full text-white font-bold flex items-center justify-center text-[10px]"
                    style={{ backgroundColor: ath.color }}
                  >
                    {ath.userName?.[0] || 'A'}
                  </div>
                  <span className="font-bold text-xs text-white">
                    {ath.userName} {ath.isCurrentUser && '(Você)'}
                  </span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  {ath.averageScore}%
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 text-center text-[11px] bg-slate-900 p-2 rounded-lg">
                <div>
                  <span className="text-[9px] text-slate-400 block">Barra</span>
                  <span className="font-bold text-blue-400">{ath.pullUps}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">Flexão</span>
                  <span className="font-bold text-emerald-400">{ath.pushUps}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">Abdom.</span>
                  <span className="font-bold text-cyan-400">{ath.sitUps}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">Corrida</span>
                  <span className="font-bold text-orange-400">{ath.runningKm}k</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 w-16">Pos</th>
                <th className="py-3 px-3">Atleta</th>
                <th className="py-3 px-3 text-center">Barra Fixa</th>
                <th className="py-3 px-3 text-center">Flexões</th>
                <th className="py-3 px-3 text-center">Abdominais</th>
                <th className="py-3 px-3 text-center">Corrida</th>
                <th className="py-3 px-3 text-right">Média / Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-200">
              {sortedRanking.map((ath, idx) => (
                <tr key={ath.userId} className={`hover:bg-slate-850/60 transition ${ath.isCurrentUser ? 'bg-blue-600/5 font-semibold' : ''}`}>
                  <td className="py-3 px-3 font-extrabold text-amber-400">
                    {idx === 0 ? '🥇 1º' : idx === 1 ? '🥈 2º' : idx === 2 ? '🥉 3º' : `${idx + 1}º`}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0"
                        style={{ backgroundColor: ath.color }}
                      >
                        {ath.userName?.[0] || 'A'}
                      </div>
                      <span className="text-white font-bold">
                        {ath.userName} {ath.isCurrentUser && <span className="text-blue-400 font-normal">(Você)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-blue-400">{ath.pullUps}</td>
                  <td className="py-3 px-3 text-center font-bold text-emerald-400">{ath.pushUps}</td>
                  <td className="py-3 px-3 text-center font-bold text-cyan-400">{ath.sitUps}</td>
                  <td className="py-3 px-3 text-center font-bold text-orange-400">{ath.runningKm} km</td>
                  <td className="py-3 px-3 text-right">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-300 font-bold border border-slate-700">
                      {ath.averageScore}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Spreadsheet Style Multi-Month Comparison Charts */}
      {(chartViewMode === 'stacked' || chartViewMode === 'single') && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              <span>Evolução Anual (Dez a Nov) - Gráficos de Linha</span>
            </h3>
          </div>

          {(chartViewMode === 'stacked' || chartViewMode === 'single') && (
            <div className="space-y-5">
              {renderSpreadsheetChart('Barra Fixa', 'pullUps', activeUserGoals.pullUps || 200, 'reps', '#2563eb')}
              {renderSpreadsheetChart('Flexões', 'pushUps', activeUserGoals.pushUps || 1000, 'reps', '#10b981')}
              {renderSpreadsheetChart('Abdominais', 'sitUps', activeUserGoals.sitUps || 500, 'reps', '#06b6d4')}
              {renderSpreadsheetChart('Corrida (KM)', 'runningKm', activeUserGoals.runningKm || 50, 'km', '#f97316')}
            </div>
          )}
        </div>
      )}

      {/* Month Focus Comparison View */}
      {chartViewMode === 'month_focus' && renderMonthFocusComparison()}
    </div>
  );
}
