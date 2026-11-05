/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './firebase/authContext';
import {
  fetchUserActivities,
  fetchUserConnections,
} from './firebase/workoutService';
import { ActivityLog, FriendConnection } from './types';
import Navbar from './components/Navbar';
import PersonalDashboard from './components/PersonalDashboard';
import RankingDashboard from './components/RankingDashboard';
import DailyLoggerModal from './components/DailyLoggerModal';
import FriendConnectionsModal from './components/FriendConnectionsModal';
import GoalsModal from './components/GoalsModal';
import AuthModal from './components/AuthModal';
import { Dumbbell, Loader2 } from 'lucide-react';

function MainApp() {
  const { user, profile, loading } = useAuth();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ranking'>('dashboard');

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [connections, setConnections] = useState<FriendConnection[]>([]);

  // Modals state
  const [dailyLoggerOpen, setDailyLoggerOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityLog | null>(null);
  const [friendsModalOpen, setFriendsModalOpen] = useState(false);
  const [goalsModalOpen, setGoalsModalOpen] = useState(false);
  const [verifyEmailModalOpen, setVerifyEmailModalOpen] = useState(false);

  const refreshData = async () => {
    if (!user) return;
    try {
      const [acts, conns] = await Promise.all([
        fetchUserActivities(selectedYear, selectedMonth),
        fetchUserConnections(),
      ]);
      setActivities(acts);
      setConnections(conns);
    } catch (e) {
      console.error('Erro ao atualizar dados:', e);
    }
  };

  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setActivities([]);
      setConnections([]);
    }
  }, [user, selectedYear, selectedMonth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4">
          <Dumbbell className="w-8 h-8 text-blue-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          <span>Carregando FitRank...</span>
        </div>
      </div>
    );
  }

  // Count incoming pending invites
  const pendingInvitesCount = connections.filter(
    (c) => c.status === 'pending' && c.targetId === user?.id
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* If not logged in, show Auth Modal */}
      {!user ? (
        <AuthModal isOpen={true} />
      ) : (
        <>
          {/* Main Top Navigation */}
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            openNewActivityModal={() => {
              setEditingActivity(null);
              setDailyLoggerOpen(true);
            }}
            openFriendsModal={() => setFriendsModalOpen(true)}
            openGoalsModal={() => setGoalsModalOpen(true)}
            openVerifyEmailModal={() => setVerifyEmailModalOpen(true)}
            selectedMonth={selectedMonth}
            setSelectedMonth={setSelectedMonth}
            selectedYear={selectedYear}
            setSelectedYear={setSelectedYear}
            pendingInvitesCount={pendingInvitesCount}
          />

          {/* Body Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 pb-28 sm:py-6">
            {activeTab === 'dashboard' && (
              <PersonalDashboard
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                activities={activities}
                openNewActivityModal={() => {
                  setEditingActivity(null);
                  setDailyLoggerOpen(true);
                }}
                onEditActivity={(act) => {
                  setEditingActivity(act);
                  setDailyLoggerOpen(true);
                }}
                openFriendsModal={() => setFriendsModalOpen(true)}
                onActivityDeleted={refreshData}
              />
            )}

            {activeTab === 'ranking' && (
              <RankingDashboard
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                connections={connections}
                openFriendsModal={() => setFriendsModalOpen(true)}
                openNewActivityModal={() => {
                  setEditingActivity(null);
                  setDailyLoggerOpen(true);
                }}
              />
            )}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
            <p>
              FitRank - Acompanhamento Físico Diário & Ranking Mútuo entre Amigos. Metas: 200 Barras | 1000 Flexões | 500 Abdominais | 50 km Corrida.
            </p>
          </footer>

          {/* Modals */}
          <DailyLoggerModal
            isOpen={dailyLoggerOpen}
            onClose={() => {
              setDailyLoggerOpen(false);
              setEditingActivity(null);
            }}
            editingActivity={editingActivity}
            onSaved={refreshData}
          />

          <FriendConnectionsModal
            isOpen={friendsModalOpen}
            onClose={() => setFriendsModalOpen(false)}
            connections={connections}
            onRefresh={refreshData}
          />

          <GoalsModal
            isOpen={goalsModalOpen}
            onClose={() => setGoalsModalOpen(false)}
          />

          {verifyEmailModalOpen && (
            <AuthModal
              isOpen={true}
              initialMode="verify_email"
              onClose={() => setVerifyEmailModalOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
