import React from 'react';
import { CheckCircle2, Dumbbell, ExternalLink, FileSpreadsheet, X } from 'lucide-react';

interface SpreadsheetReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SpreadsheetReferenceModal({
  isOpen,
  onClose,
}: SpreadsheetReferenceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Planilha Original de Referência
              </h3>
              <p className="text-xs text-slate-400">
                Comparativo fiel das metas e gráficos mensais do desafio
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

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          {/* Summary Mapping */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/60 text-center">
            <div className="p-2 bg-slate-850 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-semibold">BARRA FIXA</span>
              <span className="text-lg font-extrabold text-blue-400">200 reps</span>
            </div>
            <div className="p-2 bg-slate-850 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-semibold">FLEXÕES</span>
              <span className="text-lg font-extrabold text-emerald-400">1000 reps</span>
            </div>
            <div className="p-2 bg-slate-850 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-semibold">ABDOMINAIS</span>
              <span className="text-lg font-extrabold text-cyan-400">500 reps</span>
            </div>
            <div className="p-2 bg-slate-850 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block font-semibold">CORRIDA</span>
              <span className="text-lg font-extrabold text-orange-400">50 km</span>
            </div>
          </div>

          {/* Reference Image from workspace */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-white/5 p-2">
            <p className="text-xs font-semibold text-slate-300 mb-2 px-1">
              📷 Imagem original enviada:
            </p>
            <div className="rounded-lg overflow-hidden border border-slate-700 bg-white">
              <img
                src="/assets/aistudio/image_f4c0bb0a.png"
                alt="Planilha de Metas Mensais de Atividades Físicas"
                className="w-full h-auto object-contain max-h-[500px]"
              />
            </div>
          </div>

          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>O que foi implementado no app:</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>Conta com login, email e senha, mantendo cada usuário com acesso somente aos seus registros.</li>
              <li>Sistema de inscrição e aceite mútuo entre amigos para desbloquear o ranking.</li>
              <li>Gráficos mensais idênticos aos da planilha (Barra Fixa, Flexões, Abdominais e Corrida KM).</li>
              <li>Cores personalizadas para cada atleta (Allan em Azul, Samuel em Amarelo, Jose em Verde, Jairo em Vermelho, Thiago em Laranja).</li>
              <li>Botão para carregar os dados exatos da planilha a qualquer momento para demonstração.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-850 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition shadow"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
