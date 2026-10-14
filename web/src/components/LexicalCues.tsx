import React from 'react';
import type { LexicalCue } from '../types/interview';

interface LexicalCuesProps {
  cues: LexicalCue[];
}

export const LexicalCues: React.FC<LexicalCuesProps> = ({ cues }) => {
  if (cues.length === 0) {
    return (
      <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 text-sm text-center">
        Aguardando palavras-chave de arquitetura, concorrência ou banco de dados para ativar os gatilhos técnicos.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 overflow-y-auto">
      {cues.map((cue, idx) => (
        <div
          key={idx}
          className="p-4 rounded-lg bg-slate-900 border border-indigo-900/40 shadow-lg flex flex-col gap-3"
        >
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide">
            {cue.category}
          </span>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Verbos de Ação:</span>
            <div className="flex flex-wrap gap-1.5">
              {cue.verbs.map((v) => (
                <span
                  key={v}
                  className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-slate-400 block mb-1">Termos Técnicos Precisos:</span>
            <div className="flex flex-wrap gap-1.5">
              {cue.adjectives.map((adj) => (
                <span
                  key={adj}
                  className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 text-xs font-semibold"
                >
                  {adj}
                </span>
              ))}
            </div>
          </div>

          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-amber-200/90 italic">
            "{cue.starter}"
          </div>
        </div>
      ))}
    </div>
  );
};