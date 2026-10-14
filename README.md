# ESPECIFICAÇÃO TÉCNICA DE ENGENHARIA DE SOFTWARE

## Sistema: AET - Interview Copilot & Drill Engine (AET-ICE)

**Ambiente Alvo:** Workstation Local (Intel Core i5, 12 GB RAM, NVIDIA GTX 1650 4 GB VRAM)  
**Janela de Implementação:** 5 Dias (Quinta-feira a Segunda-feira)  
**Objetivo Tático:** Simulador de entrevista técnica com transcrição em tempo real, teleprompter de vocabulário de alto impacto e auditor pós-resposta de vícios de linguagem (*Portglish* e falsos amigos).  
**Versão:** 1.0.0-INTERVIEW-SPRINT  
**Status:** Aprovado para Construção Imediata

---

## 1. VISÃO GERAL E ARQUITETURA EM TEMPO REAL

O **AET-ICE** é uma simplificação estratégica de engenharia do sistema original, desenhada especificamente para preparar o candidato para entrevistas técnicas de software em língua inglesa dentro de uma janela crítica de tempo. O sistema opera em dois modos funcionais desacoplados:

1. **Modo Copilot (Tempo Real / Durante a Pergunta):**
   * Captura contínua do áudio do entrevistador via **Web Speech API** nativa do Chromium (zero impacto na VRAM da GPU e latência $< 100\text{ ms}$).
   * Transcrição imediata em tela em formato teleprompter (apoio visual contra ruídos de linha, velocidade excessiva ou sotaques regionais complexos).
   * **Gatilho Léxico Instantâneo (*Lexical Booster*):** Extração heurística em memória dos tópicos centrais da pergunta (ex.: concorrência, latência, SQL, falhas) com projeção de verbos de impacto (*architected, decoupled, throttled*), adjetivos de precisão (*idempotent, thread-safe*) e conectivos para estruturação de respostas no método STAR.

2. **Modo Drill & Audit (Treinamento Deliberado Pós-Resposta):**
   * Gravação e submissão da resposta oral ou textual do candidato.
   * Diagnóstico sintático-semântico assíncrono via **Ollama (Llama 3.2 3B)** acelerado por CUDA na GTX 1650 (tempo de retorno de $1.5\text{ s}$ a $2.5\text{ s}$).
   * Auditoria estrita contra armadilhas de *Portglish* (*pretend* vs. *intend*, *make an API*, *for resolve*).
   * Persistência de falhas no banco local para gerar flashcards de fixação rápida antes da entrevista.

```
+-------------------------------------------------------------------------------+
| FRONTEND SPA (TypeScript + React / Tailwind CSS)                              |
|                                                                               |
| [ENTRADA DE ÁUDIO]                  [INTERFACE DO CANDIDATO]                  |
| Áudio do Entrevistador              Teleprompter da Pergunta Transcrita       |
| (Microfone / Virtual Audio Cable)   Painel Flutuante de Verbos & Adjetivos    |
|          |                          Área de Rascunho / Resposta Estruturada   |
|          v                                       |                            |
| Web Speech API (Nativo do Browser)               |                            |
| (Zero VRAM, Latência < 100ms)                    |                            |
+------------------+-------------------------------+----------------------------+
                   | Transcrição do Texto          | Submissão da Resposta
                   v                               v
+------------------------------------+  +---------------------------------------+
| TIER 0: CLIENT-SIDE LEXICAL CUES   |  | TIER 2: AUDIT ENGINE (Ollama + CUDA)  |
| - Parser Heurístico de Intenções   |  | - Modelo: Llama 3.2 3B (Q4_K_M)       |
| - Dicionário Estático em Memória   |  | - Diagnóstico Estruturado (JSON)      |
| - Verbos, Adjetivos e STAR Frame   |  | - Portglish, Collocations & Reescrita |
| - Latência: < 2 ms                 |  | - Latência Alvo: 1.5s - 2.5s          |
+------------------------------------+  +-------------------+-------------------+
                                                            |
                                                            v
+-------------------------------------------------------------------------------+
| PERSISTÊNCIA LOCAL (PostgreSQL 16 Alpine Local)                               |
| - interview_questions (Banco de Perguntas Clássicas de Engenharia)            |
| - lexical_catalog (Tabela de Verbos de Ação, Adjetivos e Gatilhos)            |
| - interview_errors (Registro de Falhas e Reincidências com Pesos)             |
+-------------------------------------------------------------------------------+
```

---

## 2. COMPONENTE DE TRANSCRIÇÃO E GATILHOS LÉXICOS (TIER 0)

### 2.1 Captura de Voz Nativa (Zero Custo de GPU)
Para reservar integralmente os 4 GB de VRAM da placa de vídeo para a inferência neural da SLM e dispensar bibliotecas complexas de compilação em CGo, o reconhecimento de voz é delegado à API de fala nativa do Chromium (`SpeechRecognition` / `webkitSpeechRecognition`).

* **Configuração de Captura:** `continuous = true`, `interimResults = true`, `lang = 'en-US'`.
* **Roteamento de Áudio:** Entrada direta de microfone ou espelhamento via cabo de áudio virtual (*Stereo Mix* ou *VB-Cable*) para ler o som da chamada de vídeo diretamente no navegador.
* **Consumo de Recursos:** $0\text{ MB}$ de VRAM e $< 1\%$ de uso de CPU no host.

### 2.2 Motor de Dicas Contextuais em Tempo Real
Conforme o texto falado pelo entrevistador é transcrito, um módulo de correspondência léxica busca padrões temáticos e projeta cartões visuais para destravar o repertório do candidato:

| Tópico Detectado na Pergunta | Verbos de Ação Sugeridos | Adjetivos / Termos de Precisão | Estrutura de Resposta STAR |
| :--- | :--- | :--- | :--- |
| **Bancos & Persistência** (`database`, `query`, `slow`, `postgres`, `storage`, `index`) | *indexed, sharded, queried, denormalized, migrated, cached* | *atomic, consistent, idempotent, ACID-compliant, serialized* | "To optimize throughput, I isolated the bottleneck by..." |
| **Concorrência & Rede** (`goroutine`, `thread`, `parallel`, `api`, `latency`, `mutex`) | *orchestrated, dispatched, throttled, synchronized, streamed* | *thread-safe, non-blocking, concurrent, high-throughput, decoupled* | "We mitigated race conditions by introducing a mutex / channel..." |
| **Resolução de Conflitos / Falhas** (`bug`, `failed`, `outage`, `incident`, `crash`) | *troubleshot, traced, patched, isolated, rolled back, resolved* | *fault-tolerant, resilient, mission-critical, graceful* | "When the outage occurred, my immediate priority was to..." |
| **Apresentação Pessoal / Projetos** (`about yourself`, `experience`, `project`, `degree`) | *spearheaded, designed, implemented, maintained, graduated* | *full-lifecycle, scalable, robust, low-level, embedded* | "Currently, I am pursuing my bachelor's degree while developing..." |

---

## 3. ESQUEMA DE BANCO DE DADOS (POSTGRESQL 16)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CATÁLOGO DE GATILHOS LÉXICOS (Power Words para a Entrevista)
CREATE TABLE lexical_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(64) NOT NULL,
    trigger_keywords TEXT[] NOT NULL,
    action_verbs TEXT[] NOT NULL,
    precision_adjectives TEXT[] NOT NULL,
    framework_sentence_starter TEXT NOT NULL
);

-- 2. BANCO DE PERGUNTAS DE ENTREVISTA (Técnicas e Comportamentais)
CREATE TABLE interview_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(32) NOT NULL CHECK (category IN ('TECHNICAL_BACKEND', 'CONCURRENCY', 'SYSTEM_DESIGN', 'BEHAVIORAL_STAR', 'PERSONAL')),
    question_text TEXT NOT NULL,
    target_topics TEXT[] NOT NULL,
    expected_key_points TEXT[] NOT NULL
);

-- 3. REGISTRO DE RESPOSTAS E AVALIAÇÕES DO CANDIDATO
CREATE TABLE user_interview_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES interview_questions(id) ON DELETE SET NULL,
    transcribed_prompt TEXT NOT NULL,
    user_raw_answer TEXT NOT NULL,
    evaluation_score NUMERIC(3, 2) NOT NULL,
    identified_portglish JSONB DEFAULT '[]'::jsonb,
    suggested_rewrite TEXT NOT NULL,
    star_method_adherence JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. THE ERROR LEDGER (Foco Exclusivo nos Vícios Críticos do Candidato)
CREATE TABLE interview_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    error_signature VARCHAR(64) NOT NULL UNIQUE,
    canonical_name VARCHAR(128) NOT NULL,
    user_mistake_snippet TEXT NOT NULL,
    native_correction TEXT NOT NULL,
    bias_explanation_pt TEXT NOT NULL,
    reoffense_count INTEGER DEFAULT 1,
    weight INTEGER DEFAULT 2 CHECK (weight >= 1 AND weight <= 64),
    last_offense_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_interview_errors_weight ON interview_errors (weight DESC, reoffense_count DESC);

-- SEED ESSENCIAL PARA O PRIMEIRO DIA DE TREINO
INSERT INTO lexical_catalog (category, trigger_keywords, action_verbs, precision_adjectives, framework_sentence_starter) VALUES
(
    'CONCURRENCY_AND_SYSTEMS',
    ARRAY['goroutine', 'thread', 'concurrency', 'race condition', 'mutex', 'channel', 'parallel', 'async'],
    ARRAY['orchestrated', 'synchronized', 'dispatched', 'throttled', 'decoupled', 'spawned', 'buffered'],
    ARRAY['thread-safe', 'non-blocking', 'idempotent', 'deadlock-free', 'atomic', 'stateless'],
    'To prevent data races and ensure thread safety, I implemented...'
),
(
    'DATABASE_AND_LATENCY',
    ARRAY['database', 'sql', 'query', 'postgres', 'slow', 'index', 'latency', 'cache', 'redis'],
    ARRAY['indexed', 'sharded', 'denormalized', 'cached', 'profiled', 'paginated', 'persisted'],
    ARRAY['high-throughput', 'ACID-compliant', 'unindexed', 'read-heavy', 'serialized'],
    'The critical performance bottleneck was isolated at the query level by...'
),
(
    'BEHAVIORAL_AND_CONFLICTS',
    ARRAY['challenge', 'difficult', 'conflict', 'deadline', 'mistake', 'disagree', 'failure'],
    ARRAY['mitigated', 'negotiated', 'prioritized', 'rearchitected', 'debugged', 'navigated'],
    ARRAY['diplomatic', 'trade-off oriented', 'pragmatic', 'scalable', 'maintainable'],
    'When confronted with the tight delivery timeline, my strategy was to...'
);
```

---

## 4. CONTRATOS DE API (ENDPOINTS E SCHEMA OLLAMA)

### 4.1 Endpoint: Diagnóstico de Resposta de Entrevista
* **Método e Rota:** `POST /api/v1/interview/audit`
* **Trigger:** Disparado ao concluir a resposta falada ou digitada.

#### Payload de Requisição:
```json
{
  "question": "Can you describe a challenging technical bug you had to solve recently?",
  "candidate_answer": "In my last project, I needed to make an API for resolve high memory consumption. I started my graduation in 2024 and never did a memory leak troubleshoot before. But I pretended that I knew and after make some profiling, I fixed the issue."
}
```

#### Prompt Estruturado do Ollama (JSON Schema Estrito via GBNF):
```json
{
  "model": "llama3.2:3b-instruct-q4_K_M",
  "stream": false,
  "options": {
    "temperature": 0.1,
    "num_ctx": 2048
  },
  "format": {
    "type": "object",
    "properties": {
      "score": { "type": "number" },
      "portglish_violations": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "error_signature": { "type": "string" },
            "original_snippet": { "type": "string" },
            "native_fix": { "type": "string" },
            "reason_pt": { "type": "string" }
          },
          "required": ["error_signature", "original_snippet", "native_fix", "reason_pt"]
        }
      },
      "professional_rewrite": { "type": "string" },
      "star_critique": {
        "type": "object",
        "properties": {
          "situation_clear": { "type": "boolean" },
          "task_clear": { "type": "boolean" },
          "action_clear": { "type": "boolean" },
          "result_clear": { "type": "boolean" },
          "star_recommendation": { "type": "string" }
        },
        "required": ["situation_clear", "task_clear", "action_clear", "result_clear", "star_recommendation"]
      }
    },
    "required": ["score", "portglish_violations", "professional_rewrite", "star_critique"]
  }
}
```

#### Payload de Resposta (200 OK):
```json
{
  "score": 0.45,
  "portglish_violations": [
    {
      "error_signature": "FALSE_FRIEND:pretend_vs_intend",
      "original_snippet": "I pretended that I knew",
      "native_fix": "I claimed that I knew / I acted confident",
      "reason_pt": "'Pretend' significa fingir falsamente. Dizer 'I pretended that I knew' soa como fraude intelectual. Se a intenção era dizer que pretendia aprender, o termo correto é 'intended'."
    },
    {
      "error_signature": "STRUCTURAL_BIAS:for_to_infinitive",
      "original_snippet": "for resolve",
      "native_fix": "to resolve",
      "reason_pt": "Finalidade de ação exige 'to + infinitivo' ('to resolve'), nunca 'for + infinitivo'."
    },
    {
      "error_signature": "COLLOCATION:make_an_api",
      "original_snippet": "make an API",
      "native_fix": "architect an API / develop an endpoint",
      "reason_pt": "Evite verbos genéricos como 'make'. Na engenharia de software, você 'builds', 'architects' ou 'provisions' APIs."
    }
  ],
  "professional_rewrite": "In my previous project, I was tasked with resolving significant memory consumption within our backend services. Although I only began my bachelor's degree in 2024 and had not previously profiled memory leaks, I took the initiative to conduct a thorough profiling analysis, successfully pinpointing and mitigating the issue.",
  "star_critique": {
    "situation_clear": true,
    "task_clear": true,
    "action_clear": true,
    "result_clear": false,
    "star_recommendation": "Faltou apresentar uma métrica de resultado concreto (ex.: 'reducing heap allocations by 40%')."
  }
}
```

---

## 5. COMPONENTE REACT / TYPESCRIPT (TELEPROMPTER & BOOSTER)

Este componente gerencia a captura de áudio via microfone/linha, transcreve a fala do entrevistador em tempo real e projeta as pílulas de vocabulário de apoio sem travar a interface:

```tsx
import React, { useState, useEffect, useRef } from 'react';

interface LexicalCue {
  category: string;
  verbs: string[];
  adjectives: string[];
  starter: string;
}

const CUE_DICTIONARY: Record<string, LexicalCue> = {
  concurrency: {
    category: 'Concurrency & Go Runtime',
    verbs: ['orchestrated', 'synchronized', 'throttled', 'decoupled', 'streamed'],
    adjectives: ['thread-safe', 'non-blocking', 'idempotent', 'atomic'],
    starter: 'To avoid race conditions and ensure thread safety, I...'
  },
  database: {
    category: 'Persistence & Performance',
    verbs: ['indexed', 'sharded', 'denormalized', 'cached', 'profiled'],
    adjectives: ['ACID-compliant', 'high-throughput', 'read-heavy', 'serialized'],
    starter: 'I analyzed the query execution plan and identified that...'
  },
  challenge: {
    category: 'Behavioral & Problem Solving',
    verbs: ['mitigated', 'troubleshot', 'prioritized', 'refactored'],
    adjectives: ['fault-tolerant', 'resilient', 'maintainable', 'pragmatic'],
    starter: 'When faced with this constraint, my systematic approach was to...'
  }
};

export const LiveInterviewTeleprompter: React.FC = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [activeCues, setActiveCues] = useState<LexicalCue[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error('Navegador incompatível com Web Speech API.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      setTranscript(currentTranscript);
      detectTriggers(currentTranscript.toLowerCase());
    };

    recognition.onerror = (event: any) => {
      console.error('Erro de captação de áudio:', event.error);
    };

    recognitionRef.current = recognition;
  }, []);

  const detectTriggers = (text: string) => {
    const detected: LexicalCue[] = [];
    if (text.includes('routine') || text.includes('thread') || text.includes('concurrent') || text.includes('parallel')) {
      detected.push(CUE_DICTIONARY.concurrency);
    }
    if (text.includes('database') || text.includes('query') || text.includes('sql') || text.includes('slow') || text.includes('latency')) {
      detected.push(CUE_DICTIONARY.database);
    }
    if (text.includes('challenge') || text.includes('difficult') || text.includes('bug') || text.includes('fail') || text.includes('problem')) {
      detected.push(CUE_DICTIONARY.challenge);
    }
    setActiveCues(detected);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setActiveCues([]);
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 p-6 font-mono">
      {/* Barra Superior de Estado */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${isListening ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <h1 className="text-lg font-bold">AET-ICE: Interview Teleprompter</h1>
        </div>
        <button
          onClick={toggleListening}
          className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
            isListening ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {isListening ? 'Parar Reconhecimento' : 'Iniciar Escuta do Entrevistador'}
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6 mt-6 flex-1 overflow-hidden">
        {/* Painel da Esquerda: Transcrição em Tempo Real */}
        <div className="col-span-7 flex flex-col bg-slate-900 rounded-lg p-5 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
            Pergunta Transcrita do Entrevistador:
          </span>
          <div className="flex-1 overflow-y-auto p-4 bg-slate-950 rounded border border-slate-800 text-lg leading-relaxed text-slate-200">
            {transcript || (
              <span className="text-slate-600 italic">
                Aguardando fala em inglês do entrevistador...
              </span>
            )}
          </div>
        </div>

        {/* Painel da Direita: Pílulas de Vocabulário & STAR */}
        <div className="col-span-5 flex flex-col gap-4 overflow-y-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Gatilhos de Vocabulário Técnico:
          </span>

          {activeCues.length === 0 ? (
            <div className="p-6 rounded-lg bg-slate-900 border border-slate-800 text-slate-500 text-sm text-center">
              Fale termos de arquitetura para projetar palavras-chave recomendadas em tempo real.
            </div>
          ) : (
            activeCues.map((cue, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-slate-900 border border-indigo-900/40 shadow-lg flex flex-col gap-3">
                <span className="text-xs font-bold text-indigo-400 uppercase">{cue.category}</span>
                
                <div>
                  <span className="text-xs text-slate-400 block mb-1">Verbos de Ação:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {cue.verbs.map((v) => (
                      <span key={v} className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block mb-1">Termos Técnicos Precisos:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {cue.adjectives.map((adj) => (
                      <span key={adj} className="px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800 text-xs">
                        {adj}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-amber-200/90 italic">
                  "{cue.starter}"
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
```

---

## 6. SERVIÇO DE BACKEND EM GO COM OLLAMA LOCAL

```go
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type AuditRequest struct {
	Question        string `json:"question" binding:"required"`
	CandidateAnswer string `json:"candidate_answer" binding:"required"`
}

type PortglishViolation struct {
	ErrorSignature  string `json:"error_signature"`
	OriginalSnippet string `json:"original_snippet"`
	NativeFix       string `json:"native_fix"`
	ReasonPt        string `json:"reason_pt"`
}

type StarCritique struct {
	SituationClear     bool   `json:"situation_clear"`
	TaskClear          bool   `json:"task_clear"`
	ActionClear        bool   `json:"action_clear"`
	ResultClear        bool   `json:"result_clear"`
	StarRecommendation string `json:"star_recommendation"`
}

type AuditResponse struct {
	Score               float64              `json:"score"`
	PortglishViolations []PortglishViolation `json:"portglish_violations"`
	ProfessionalRewrite string               `json:"professional_rewrite"`
	StarCritique        StarCritique         `json:"star_critique"`
}

type OllamaChatRequest struct {
	Model    string                 `json:"model"`
	Stream   bool                   `json:"stream"`
	Format   string                 `json:"format"`
	Messages []ChatMessage          `json:"messages"`
	Options  map[string]interface{} `json:"options"`
}

type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OllamaChatResponse struct {
	Message ChatMessage `json:"message"`
}

const (
	OllamaHost  = "http://localhost:11434"
	TargetModel = "llama3.2:3b-instruct-q4_K_M"
)

func handleAudit(c *gin.Context) {
	var req AuditRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload inválido: " + err.Error()})
		return
	}

	systemPrompt := `You are an elite Senior Staff Software Engineer and Technical Interviewer assessing a Brazilian software engineering candidate.
Analyze the candidate's answer to the given technical interview question.
Detect Portglish, false friends, incorrect prepositions, and weak generic verbs (e.g., 'make an API' -> 'architect an API').
Critique their adherence to the STAR method (Situation, Task, Action, Result).
Return strictly a valid JSON matching this schema:
{
  "score": 0.0 to 1.0,
  "portglish_violations": [
    {
      "error_signature": "CATEGORY:RULE_NAME",
      "original_snippet": "exact snippet",
      "native_fix": "native correction",
      "reason_pt": "Explicação em português do vício linguístico"
    }
  ],
  "professional_rewrite": "Ideal native answer using precise software engineering vocabulary",
  "star_critique": {
    "situation_clear": true|false,
    "task_clear": true|false,
    "action_clear": true|false,
    "result_clear": true|false,
    "star_recommendation": "Feedback on metric and narrative structure"
  }
}`

	userPrompt := fmt.Sprintf("INTERVIEW QUESTION:\n%s\n\nCANDIDATE ANSWER:\n%s", req.Question, req.CandidateAnswer)

	ollamaPayload := OllamaChatRequest{
		Model:  TargetModel,
		Stream: false,
		Format: "json",
		Options: map[string]interface{}{
			"temperature": 0.1,
			"num_ctx":     2048,
		},
		Messages: []ChatMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
	}

	payloadBytes, err := json.Marshal(ollamaPayload)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha na serialização do prompt: " + err.Error()})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()

	httpReq, err := http.NewRequestWithContext(ctx, "POST", OllamaHost+"/api/chat", bytes.NewBuffer(payloadBytes))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha na criação da requisição HTTP: " + err.Error()})
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	httpResp, err := client.Do(httpReq)
	if err != nil {
		c.JSON(http.StatusGatewayTimeout, gin.H{"error": "Timeout na resposta da SLM local: " + err.Error()})
		return
	}
	defer httpResp.Body.Close()

	bodyBytes, err := io.ReadAll(httpResp.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao ler corpo da resposta do Ollama"})
		return
	}

	var rawOllamaResp OllamaChatResponse
	if err := json.Unmarshal(bodyBytes, &rawOllamaResp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao decodificar JSON do Ollama: " + err.Error()})
		return
	}

	var parsedAudit AuditResponse
	if err := json.Unmarshal([]byte(rawOllamaResp.Message.Content), &parsedAudit); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":     "A SLM gerou formato fora do schema",
			"raw_text":  rawOllamaResp.Message.Content,
		})
		return
	}

	c.JSON(http.StatusOK, parsedAudit)
}

func main() {
	r := gin.Default()

	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	})

	r.POST("/api/v1/interview/audit", handleAudit)

	log.Println("==> AET-ICE ouvindo na porta 8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Falha crítica ao subir servidor Gin: %v", err)
	}
}
```

---

## 7. ORQUESTRADOR LOCAL MÍNIMO (`docker-compose.interview.yml`)

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: aet_interview_db
    restart: unless-stopped
    command: postgres -c shared_buffers=128MB -c work_mem=8MB -c max_connections=30
    environment:
      POSTGRES_DB: aet_interview
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: devpassword123
    ports:
      - "5432:5432"
    volumes:
      - pgdata_interview:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          cpus: '1.00'
          memory: 512M

  ollama:
    image: ollama/ollama:latest
    container_name: aet_interview_ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    environment:
      - OLLAMA_FLASH_ATTENTION=1
      - OLLAMA_KEEP_ALIVE=60m
    volumes:
      - ollama_models:/root/.ollama
    deploy:
      resources:
        limits:
          memory: 1536M
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

volumes:
  pgdata_interview:
  ollama_models:
```

---

## 8. PLANO OPERACIONAL TÁTICO DE 5 DIAS

| Período | Janela de Código (Construção) | Janela de Treino (Inglês para Entrevista) |
| :--- | :--- | :--- |
| **Quinta-feira** | Subir Docker (`Postgres + Ollama`), compilar backend em Go e validar payload JSON do `llama3.2:3b` na GTX 1650 em $< 2\text{ s}$. | Estruturar em texto 3 respostas clássicas: *"Tell me about yourself"*, *"Explain a difficult bug you solved"*, *"Why Go?"*. |
| **Sexta-feira** | Integrar componente React de transcrição com Web Speech API e tela de teleprompter/cues flutuantes. | Praticar a leitura das respostas em voz alta em frente ao microfone: validar se a transcrição reconhece sua pronúncia com precisão. |
| **Sábado** | Conectar botão "Auditar Resposta" com a API em Go e salvar os desvios no PostgreSQL. | **Maratona STAR:** Submeter 8 respostas técnicas de concorrência, canais, APIs e bancos de dados para caçar *Portglish*. |
| **Domingo** | Ajustar tela de revisão rápida para listar os vícios mais frequentes cometidos no sábado. | **Simulação Cega:** Falar as respostas sem olhar roteiro prévio, utilizando apenas as pílulas de vocabulário e STAR como guia. |
| **Segunda (Tarde)**| **Congelamento total de código.** Nenhuma linha nova. | **Aquecimento Vocal:** Foco exclusivo na cadência, entonação e clareza de articulação das palavras técnicas. |