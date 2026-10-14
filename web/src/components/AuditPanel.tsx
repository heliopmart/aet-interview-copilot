import React from 'react';
import type { AuditResponse } from '../types/interview';

interface AuditPanelProps {
  audit: AuditResponse | null;
  isLoading: boolean;
}

export const AuditPanel: React.FC<AuditPanelProps> = ({ audit, isLoading }) => {
  if (isLoading) {
    return (
      <div className="p-8 rounded-lg bg-slate-900 border border-slate-800 text-center flex flex-col items-center justify-center gap-3">
        <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">
          Executando auditoria técnica no Llama 3.2 via GPU local...
        </span>
      </div>
    );
  }

  if (!audit) {
    return (
      <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 text-sm text-center">
        Submeta sua resposta falada ou digitada para auditar Portglish e alinhamento STAR.
      </div>
    );
  }

  const scorePercentage = Math.round(audit.score * 100);

  return (
    <div className="flex flex-col gap-6 bg-slate-900 border border-slate-800 rounded-lg p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Diagnóstico da Resposta
          </h2>
          <span className="text-xs text-slate-500">Avaliação sintática e semântica de engenharia</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Score Técnico:</span>
          <span
            className={`text-xl font-black px-3 py-1 rounded ${
              scorePercentage >= 70
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : scorePercentage >= 40
                ? 'bg-amber-950 text-amber-300 border border-amber-800'
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}
          >
            {scorePercentage}%
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">
          Desvios Linguísticos e Portglish Detectados ({audit.portglish_violations.length}):
        </h3>
        {audit.portglish_violations.length === 0 ? (
          <div className="p-3 rounded bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs">
            Nenhuma infração de Portglish ou vício de linguagem identificado.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {audit.portglish_violations.map((violation, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded bg-slate-950 border border-rose-900/40 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                    {violation.error_signature}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="line-through text-rose-300/80 bg-rose-950/40 px-1.5 py-0.5 rounded">
                    "{violation.original_snippet}"
                  </span>
                  <span className="text-slate-500">→</span>
                  <span className="text-emerald-300 font-semibold bg-emerald-950/40 px-1.5 py-0.5 rounded">
                    "{violation.native_fix}"
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{violation.reason_pt}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase text-slate-400 mb-2">
          Reescrita Técnica Profissional (Inglês Nativo):
        </h3>
        <div className="p-4 rounded bg-slate-950 border border-indigo-900/40 text-sm text-slate-200 leading-relaxed font-sans">
          {audit.professional_rewrite}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase text-slate-400 mb-3">
          Critique do Método STAR:
        </h3>
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div
            className={`p-2 rounded text-center text-xs font-bold ${
              audit.star_critique.situation_clear
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}
          >
            S (Situação)
          </div>
          <div
            className={`p-2 rounded text-center text-xs font-bold ${
              audit.star_critique.task_clear
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}
          >
            T (Tarefa)
          </div>
          <div
            className={`p-2 rounded text-center text-xs font-bold ${
              audit.star_critique.action_clear
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}
          >
            A (Ação)
          </div>
          <div
            className={`p-2 rounded text-center text-xs font-bold ${
              audit.star_critique.result_clear
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-rose-950 text-rose-300 border border-rose-800'
            }`}
          >
            R (Resultado)
          </div>
        </div>
        <p className="text-xs text-amber-200/90 bg-amber-950/30 border border-amber-800/40 p-3 rounded">
          {audit.star_critique.star_recommendation}
        </p>
      </div>
    </div>
  );
};