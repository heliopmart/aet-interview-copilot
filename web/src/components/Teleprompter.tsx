import React, { useState, useEffect, useRef } from 'react';

interface TeleprompterProps {
  transcript: string;
  isListening: boolean;
  onClear: () => void;
}

export const Teleprompter: React.FC<TeleprompterProps> = ({
  transcript,
  isListening,
  onClear,
}) => {
  const [fontSize, setFontSize] = useState<'text-sm' | 'text-base' | 'text-lg' | 'text-xl'>('text-lg');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Rolagem automática suave conforme novas palavras entram
  useEffect(() => {
    if (autoScroll && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [transcript, autoScroll]);

  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

  return (
    <div className="flex flex-col bg-slate-900 rounded-lg p-5 border border-slate-800 flex-1 shadow-xl">
      {/* Barra de Ferramentas do Teleprompter */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
            Pergunta Transcrita (Teleprompter):
          </span>
          {isListening && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-[10px] font-semibold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Contador de Palavras */}
          <span className="text-[11px] text-slate-500 font-medium">
            {wordCount} {wordCount === 1 ? 'palavra' : 'palavras'}
          </span>

          {/* Seletor de Tamanho de Fonte */}
          <div className="flex items-center rounded bg-slate-950 border border-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => setFontSize('text-sm')}
              className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                fontSize === 'text-sm' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              S
            </button>
            <button
              type="button"
              onClick={() => setFontSize('text-base')}
              className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                fontSize === 'text-base' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              M
            </button>
            <button
              type="button"
              onClick={() => setFontSize('text-lg')}
              className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                fontSize === 'text-lg' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              L
            </button>
            <button
              type="button"
              onClick={() => setFontSize('text-xl')}
              className={`px-1.5 py-0.5 text-[10px] rounded transition-colors ${
                fontSize === 'text-xl' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              XL
            </button>
          </div>

          {/* Toggle Auto-Scroll */}
          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Desativar auto-scroll' : 'Ativar auto-scroll'}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
              autoScroll
                ? 'bg-slate-800 text-indigo-300 border-indigo-700/50'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
          >
            Auto-Scroll
          </button>

          {/* Botão de Limpar Buffer */}
          <button
            type="button"
            onClick={onClear}
            disabled={!transcript}
            className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-950 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-900/40 transition-colors disabled:opacity-40 disabled:hover:bg-slate-950 disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Caixa do Teleprompter */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 min-h-[160px] max-h-[300px] p-4 bg-slate-950 rounded border border-slate-800 ${fontSize} leading-relaxed text-slate-100 overflow-y-auto selection:bg-indigo-900 selection:text-white`}
      >
        {transcript ? (
          <p className="whitespace-pre-wrap">{transcript}</p>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 italic gap-1">
            <span>Aguardando a pergunta em inglês do entrevistador...</span>
            <span className="text-xs text-slate-700">
              Clique em "Iniciar Escuta do Entrevistador" no topo para ativar a Web Speech API.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};