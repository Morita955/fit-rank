import React, { useEffect, useState } from 'react';
import { useAuth } from '../firebase/authContext';
import {
  acceptFriendRequest,
  removeFriendConnection,
  searchPublicProfiles,
  sendFriendRequest,
} from '../firebase/workoutService';
import { FriendConnection, PublicProfile, USER_COLORS } from '../types';
import {
  AlertCircle,
  Check,
  Clock,
  Search,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';

interface FriendConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  connections: FriendConnection[];
  onRefresh?: () => void;
}

export default function FriendConnectionsModal({
  isOpen,
  onClose,
  connections,
  onRefresh,
}: FriendConnectionsModalProps) {
  const { user, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [publicProfiles, setPublicProfiles] = useState<PublicProfile[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Incoming pending requests (others asking to connect with me)
  const incomingRequests = connections.filter(
    (c) => c.status === 'pending' && c.targetId === user?.id
  );

  // Outgoing pending requests (I requested to connect with someone else)
  const outgoingRequests = connections.filter(
    (c) => c.status === 'pending' && c.requesterId === user?.id
  );

  // Accepted active connections
  const acceptedFriends = connections.filter((c) => c.status === 'accepted');

  useEffect(() => {
    if (isOpen && user) {
      loadProfiles();
    }
  }, [isOpen, user]);

  const loadProfiles = async () => {
    if (!user) return;
    setLoadingSearch(true);
    try {
      const results = await searchPublicProfiles(user.id, searchTerm);
      setPublicProfiles(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProfiles();
  };

  const handleSendInvite = async (target: PublicProfile) => {
    if (!user) return;
    setActionLoading(target.uid);
    setMessage(null);
    try {
      await sendFriendRequest(
        { uid: user.id, displayName: profile?.displayName || 'Atleta' },
        { uid: target.uid, displayName: target.displayName || 'Atleta' }
      );
      setMessage({
        type: 'success',
        text: `Solicitação enviada para ${target.displayName}! O ranking mútuo será liberado assim que ele aceitar.`,
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err?.message || 'Erro ao enviar convite.',
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (conn: FriendConnection) => {
    if (!conn.id || !user) return;
    setActionLoading(conn.id);
    setMessage(null);
    try {
      await acceptFriendRequest(
        conn.id,
        user.id,
        profile?.displayName || 'Atleta'
      );
      setMessage({
        type: 'success',
        text: `Conexão aceita! Agora você e ${conn.requesterName} podem comparar desempenhos no Ranking.`,
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Erro ao aceitar solicitação.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineOrRemove = async (connId?: string) => {
    if (!connId) return;
    setActionLoading(connId);
    setMessage(null);
    try {
      await removeFriendConnection(connId);
      setMessage({ type: 'success', text: 'Conexão removida.' });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Erro ao remover conexão.' });
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-lg font-bold text-white">
                Amigos & Conexões de Ranking
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Inscrição e aceite mútuo para desbloquear o ranking compartilhado
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 overscroll-contain">
          {/* Privacy Rules Explainer */}
          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Regra de Acesso e Privacidade:</p>
              <p className="text-blue-300/90 mt-0.5 leading-relaxed">
                Cada usuário vê somente suas próprias atividades. Para ver o progresso de outro atleta no ranking mensal e nos gráficos comparativos, você precisa enviar uma solicitação e ser aceito por ele.
              </p>
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{message.text}</span>
            </div>
          )}

          {/* Section 1: Incoming Pending Requests (To Accept) */}
          {incomingRequests.length > 0 && (
            <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Solicitações Recebidas ({incomingRequests.length})</span>
              </h4>
              <p className="text-xs text-slate-300">
                Estes atletas querem se conectar com você no Ranking. Aceite para liberar a visualização mútua!
              </p>
              <div className="space-y-2">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700 gap-3"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs shrink-0">
                        {req.requesterName?.[0] || 'A'}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{req.requesterName || 'Atleta'}</p>
                        <p className="text-[11px] text-slate-400 truncate">{req.requesterEmail || 'E-mail não disponível'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAccept(req)}
                        disabled={actionLoading === req.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aceitar</span>
                      </button>
                      <button
                        onClick={() => handleDeclineOrRemove(req.id)}
                        disabled={actionLoading === req.id}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition"
                        title="Recusar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Outgoing Pending Requests */}
          {outgoingRequests.length > 0 && (
            <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Solicitações Enviadas Aguardando Aceite ({outgoingRequests.length})</span>
              </h4>
              <div className="divide-y divide-slate-800">
                {outgoingRequests.map((req) => (
                  <div key={req.id} className="py-2 flex items-center justify-between text-xs">
                    <span className="text-slate-300">{req.targetName || 'Atleta'}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-amber-400 font-medium">Aguardando aceite...</span>
                      <button
                        onClick={() => handleDeclineOrRemove(req.id)}
                        className="text-[11px] text-slate-500 hover:text-red-400 underline"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Accepted Friends / Competitors */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Atletas Conectados no Ranking ({acceptedFriends.length})</span>
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold lowercase">
                visíveis no ranking
              </span>
            </h4>

            {acceptedFriends.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-400">
                Você ainda não tem atletas conectados. Envie uma solicitação abaixo pesquisando outros atletas registrados.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {acceptedFriends.map((conn) => {
                  const friendName = conn.userA === user?.id ? conn.targetName : conn.requesterName;
                  const cleanName = friendName?.split(' ')[0] || '';
                  const color = USER_COLORS[cleanName] || '#64748b';

                  return (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-xs"
                          style={{ backgroundColor: color }}
                        >
                          {friendName?.[0] || 'A'}
                        </div>
                        <span className="text-xs font-semibold text-white truncate max-w-[140px]">
                          {friendName || 'Atleta'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeclineOrRemove(conn.id)}
                        className="text-[10px] text-slate-400 hover:text-red-400 hover:bg-slate-700 px-2 py-1 rounded transition"
                      >
                        Desconectar
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 4: Search & Connect New Athletes */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-400" />
              <span>Conectar Novo Atleta</span>
            </h4>

            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar atleta por nome ou email..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 sm:py-2 text-base sm:text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition touch-manipulation shrink-0"
              >
                Buscar
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {publicProfiles.length === 0 ? (
                <p className="text-center py-3 text-xs text-slate-500">
                  {loadingSearch ? 'Buscando...' : 'Nenhum outro atleta encontrado com esse nome.'}
                </p>
              ) : (
                publicProfiles.map((p) => {
                  const isAlreadyConnected = connections.some(
                    (c) =>
                      c.status === 'accepted' &&
                      (c.userA === p.uid || c.userB === p.uid)
                  );
                  const isPending = connections.some(
                    (c) =>
                      c.status === 'pending' &&
                      (c.userA === p.uid || c.userB === p.uid)
                  );

                  return (
                    <div
                      key={p.uid}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-850 border border-slate-800 hover:border-slate-700 transition text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-600/30 text-blue-400 font-bold flex items-center justify-center text-xs">
                          {p.displayName?.[0] || 'A'}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{p.displayName}</p>
                          {p.email && <p className="text-[10px] text-slate-500">{p.email}</p>}
                        </div>
                      </div>

                      {isAlreadyConnected ? (
                        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3 h-3" /> Conectado
                        </span>
                      ) : isPending ? (
                        <span className="text-[11px] text-amber-400 font-medium">Pendente</span>
                      ) : (
                        <button
                          onClick={() => handleSendInvite(p)}
                          disabled={actionLoading === p.uid}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
                        >
                          Conectar
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
