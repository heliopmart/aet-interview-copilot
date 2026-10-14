/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { LexicalCue, AuditResponse } from './types/interview';
import { Teleprompter } from './components/Teleprompter';
import { LexicalCues } from './components/LexicalCues';
import { AuditPanel } from './components/AuditPanel';

const CUE_DICTIONARY: Record<string, LexicalCue> = {
  concurrency: {
    category: 'Concurrency & Go Runtime',
    verbs: ['orchestrated', 'synchronized', 'throttled', 'decoupled', 'streamed'],
    adjectives: ['thread-safe', 'non-blocking', 'idempotent', 'atomic'],
    starter: 'To avoid race conditions and ensure thread safety, I implemented...',
  },
  database: {
    category: 'Persistence & Performance',
    verbs: ['indexed', 'sharded', 'denormalized', 'cached', 'profiled'],
    adjectives: ['ACID-compliant', 'high-throughput', 'read-heavy', 'serialized'],
    starter: 'I analyzed the query execution plan and isolated the bottleneck at...',
  },
  challenge: {
    category: 'Behavioral & Incident Resolution',
    verbs: ['mitigated', 'troubleshot', 'prioritized', 'refactored', 'isolated'],
    adjectives: ['fault-tolerant', 'resilient', 'maintainable', 'mission-critical'],
    starter: 'When confronted with this constraint, my systematic approach was to...',
  },
};

export const App: React.FC = () => {
  const [isListeningInterviewer, setIsListeningInterviewer] = useState<boolean>(false);
  const [questionTranscript, setQuestionTranscript] = useState<string>('');
  const [candidateAnswer, setCandidateAnswer] = useState<string>('');
  const [activeCues, setActiveCues] = useState<LexicalCue[]>([]);
  const [auditResult, setAuditResult] = useState<AuditResponse | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  const detectTriggers = useCallback((text: string) => {
    const matched: LexicalCue[] = [];
    if (
      text.includes('routine') ||
      text.includes('thread') ||
      text.includes('concurrency') ||
      text.includes('parallel') ||
      text.includes('mutex') ||
      text.includes('channel')
    ) {
      matched.push(CUE_DICTIONARY.concurrency);
    }
    if (
      text.includes('database') ||
      text.includes('query') ||
      text.includes('sql') ||
      text.includes('postgres') ||
      text.includes('latency') ||
      text.includes('cache')
    ) {
      matched.push(CUE_DICTIONARY.database);
    }
    if (
      text.includes('challenge') ||
      text.includes('difficult') ||
      text.includes('bug') ||
      text.includes('fail') ||
      text.includes('problem') ||
      text.includes('mistake')
    ) {
      matched.push(CUE_DICTIONARY.challenge);
    }
    setActiveCues(matched);
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API indisponível neste navegador.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let fullText = '';
      for (let i = 0; i < event.results.length; i++) {
        fullText += event.results[i][0].transcript + ' ';
      }
      const trimmed = fullText.trim();
      setQuestionTranscript(trimmed);
      detectTriggers(trimmed.toLowerCase());
    };

    recognition.onerror = (event: any) => {
      console.error('Erro no reconhecimento de voz:', event.error);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [detectTriggers]);

  const toggleInterviewerListening = () => {
    if (!recognitionRef.current) return;

    if (isListeningInterviewer) {
      recognitionRef.current.stop();
      setIsListeningInterviewer(false);
    } else {
      setQuestionTranscript('');
      setActiveCues([]);
      recognitionRef.current.start();
      setIsListeningInterviewer(true);
    }
  };

  const handleClearTranscript = () => {
    setQuestionTranscript('');
    setActiveCues([]);
  };

  const handleAuditSubmission = async () => {
    if (!candidateAnswer.trim() || !questionTranscript.trim()) return;

    setIsAuditing(true);
    setAuditResult(null);

    try {
      const response = await fetch('http://localhost:8080/api/v1/interview/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionTranscript,
          candidate_answer: candidateAnswer,
        }),
      });

      if (!response.ok) {
        throw new Error(`Falha na requisição: ${response.statusText}`);
      }

      const data: AuditResponse = await response.json();
      setAuditResult(data);
    } catch (err) {
      console.error('Erro ao auditar resposta:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-mono">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div
            className={`h-3 w-3 rounded-full ${
              isListeningInterviewer ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
            }`}
          />
          <h1 className="text-base font-bold tracking-tight text-slate-200">
            AET-ICE <span className="text-xs text-indigo-400 font-normal">| Technical Interview Copilot</span>
          </h1>
        </div>
        <button
          onClick={toggleInterviewerListening}
          className={`px-4 py-2 rounded text-xs font-bold transition-all ${
            isListeningInterviewer
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-950'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950'
          }`}
        >
          {isListeningInterviewer ? 'Parar Escuta do Entrevistador' : 'Iniciar Escuta do Entrevistador'}
        </button>
      </header>

      <main className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
        <section className="col-span-7 flex flex-col gap-6">
          {/* Componente Teleprompter Modular */}
          <Teleprompter
            transcript={questionTranscript}
            isListening={isListeningInterviewer}
            onClear={handleClearTranscript}
          />

          <div className="flex flex-col bg-slate-900 rounded-lg p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Sua Resposta Oral ou Rascunho STAR:
              </span>
              <button
                onClick={handleAuditSubmission}
                disabled={isAuditing || !candidateAnswer.trim() || !questionTranscript.trim()}
                className="px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                {isAuditing ? 'Auditando via GPU...' : 'Auditar Resposta'}
              </button>
            </div>
            <textarea
              value={candidateAnswer}
              onChange={(e) => setCandidateAnswer(e.target.value)}
              placeholder="Digite ou fale sua resposta em inglês utilizando o vocabulário sugerido..."
              rows={5}
              className="w-full p-4 bg-slate-950 rounded border border-slate-800 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-sans"
            />
          </div>

          <AuditPanel audit={auditResult} isLoading={isAuditing} />
        </section>

        <aside className="col-span-5 flex flex-col gap-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            Gatilhos Léxicos & Estrutura STAR:
          </span>
          <LexicalCues cues={activeCues} />
        </aside>
      </main>
    </div>
  );
};

export default App;