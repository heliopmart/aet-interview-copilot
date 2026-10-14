package main

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"

	"aet-ice/internal/database"

	"github.com/gin-gonic/gin"
)

type AuditRequest struct {
	QuestionID      *string `json:"question_id"`
	Question        string  `json:"question" binding:"required"`
	CandidateAnswer string  `json:"candidate_answer" binding:"required"`
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
	TargetModel = "llama3.2:3b"
)

var db *sql.DB

func handleAudit(c *gin.Context) {
	var req AuditRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Payload inválido: " + err.Error()})
		return
	}

	systemPrompt := `You are an elite Senior Staff Engineer evaluating a Brazilian candidate in an ENGLISH technical interview.
The candidate MUST speak in English. Do NOT translate their answer to Portuguese.
Audit Portglish, false friends (e.g. 'pretend' instead of 'intend'), wrong prepositions ('for resolve' -> 'to resolve'), and weak verbs ('make an API' -> 'architect an API').

CRITICAL RULES:
1. 'native_fix' MUST be natural, professional ENGLISH.
2. 'professional_rewrite' MUST be a concise, single-paragraph STAR answer in ENGLISH.
3. 'reason_pt' MUST be ONE short, direct sentence in Portuguese explaining the mistake.
4. 'error_signature' MUST strictly use format 'CATEGORY:SPECIFIC_ERROR'.
5. Always generate a fully closed and valid JSON document.

FEW-SHOT EXAMPLE:
Input:
Question: Tell me about a bug.
Answer: I needed to make an API for resolve a leak. I pretended I knew.
Output:
{
  "score": 0.40,
  "portglish_violations": [
    {
      "error_signature": "COLLOCATION:make_an_api",
      "original_snippet": "make an API",
      "native_fix": "architect an API / design an endpoint",
      "reason_pt": "Evite 'make'; em engenharia use verbos como 'architect' ou 'build'."
    },
    {
      "error_signature": "GRAMMAR:for_infinitive",
      "original_snippet": "for resolve",
      "native_fix": "to resolve",
      "reason_pt": "Finalidade de ação exige 'to + verbo', nunca 'for + verbo'."
    },
    {
      "error_signature": "FALSE_FRIEND:pretend_vs_intend",
      "original_snippet": "pretended I knew",
      "native_fix": "acted confident / was determined to learn",
      "reason_pt": "'Pretend' significa fingir; transmite ideia de fraude técnica."
    }
  ],
  "professional_rewrite": "In my previous project, I was tasked with architecting an API to resolve a critical memory leak. I systematically profiled heap allocations and eliminated the bottleneck.",
  "star_critique": {
    "situation_clear": true,
    "task_clear": true,
    "action_clear": true,
    "result_clear": false,
    "star_recommendation": "Inclua uma métrica quantitativa no resultado (ex: 'reducing RAM by 35%')."
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
			"num_predict": 512,
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

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
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
			"error":    "A SLM gerou formato fora do schema",
			"raw_text": rawOllamaResp.Message.Content,
		})
		return
	}

	go persistAuditResults(req, parsedAudit)

	c.JSON(http.StatusOK, parsedAudit)
}

func persistAuditResults(req AuditRequest, audit AuditResponse) {
	if db == nil {
		log.Println("[WARN] Banco não inicializado. Ignorando persistência.")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		log.Println("[ERRO] Falha ao iniciar transação no Postgres:", err)
		return
	}
	defer tx.Rollback()

	violationsJSON, err := json.Marshal(audit.PortglishViolations)
	if err != nil {
		log.Println("[ERRO] Falha ao serializar portglish_violations:", err)
		return
	}

	starJSON, err := json.Marshal(audit.StarCritique)
	if err != nil {
		log.Println("[ERRO] Falha ao serializar star_critique:", err)
		return
	}

	insertLogQuery := `
		INSERT INTO user_interview_logs (
			question_id,
			transcribed_prompt,
			user_raw_answer,
			evaluation_score,
			identified_portglish,
			suggested_rewrite,
			star_method_adherence
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err = tx.ExecContext(ctx, insertLogQuery,
		req.QuestionID,
		req.Question,
		req.CandidateAnswer,
		audit.Score,
		violationsJSON,
		audit.ProfessionalRewrite,
		starJSON,
	)
	if err != nil {
		log.Println("[ERRO] Falha ao inserir em user_interview_logs:", err)
		return
	}

	upsertErrorQuery := `
		INSERT INTO interview_errors (
			error_signature,
			canonical_name,
			user_mistake_snippet,
			native_correction,
			bias_explanation_pt,
			reoffense_count,
			weight,
			last_offense_at
		) VALUES ($1, $2, $3, $4, $5, 1, 2, CURRENT_TIMESTAMP)
		ON CONFLICT (error_signature) DO UPDATE SET
			reoffense_count = interview_errors.reoffense_count + 1,
			weight = LEAST(64, interview_errors.weight * 2),
			user_mistake_snippet = EXCLUDED.user_mistake_snippet,
			native_correction = EXCLUDED.native_correction,
			bias_explanation_pt = EXCLUDED.bias_explanation_pt,
			last_offense_at = CURRENT_TIMESTAMP
	`

	for _, violation := range audit.PortglishViolations {
		canonicalName := violation.ErrorSignature
		_, err = tx.ExecContext(ctx, upsertErrorQuery,
			violation.ErrorSignature,
			canonicalName,
			violation.OriginalSnippet,
			violation.NativeFix,
			violation.ReasonPt,
		)
		if err != nil {
			log.Printf("[ERRO] Falha no UPSERT do erro '%s': %v\n", violation.ErrorSignature, err)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		log.Println("[ERRO] Falha ao efetivar commit da auditoria:", err)
		return
	}

	log.Printf("[LEDGER] Auditoria persistida: %d erros auditados/atualizados no banco.\n", len(audit.PortglishViolations))
}

func handleGetErrors(c *gin.Context) {
	if db == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Banco indisponível"})
		return
	}

	query := `
		SELECT error_signature, canonical_name, user_mistake_snippet, native_correction, bias_explanation_pt, reoffense_count, weight, last_offense_at
		FROM interview_errors
		ORDER BY weight DESC, reoffense_count DESC
	`

	rows, err := db.Query(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao consultar erros: " + err.Error()})
		return
	}
	defer rows.Close()

	type ErrorItem struct {
		Signature       string    `json:"error_signature"`
		CanonicalName   string    `json:"canonical_name"`
		Snippet         string    `json:"user_mistake_snippet"`
		NativeFix       string    `json:"native_correction"`
		ExplanationPt   string    `json:"bias_explanation_pt"`
		ReoffenseCount  int       `json:"reoffense_count"`
		Weight          int       `json:"weight"`
		LastOffenseAt   time.Time `json:"last_offense_at"`
	}

	var errorsList []ErrorItem
	for rows.Next() {
		var item ErrorItem
		if err := rows.Scan(
			&item.Signature,
			&item.CanonicalName,
			&item.Snippet,
			&item.NativeFix,
			&item.ExplanationPt,
			&item.ReoffenseCount,
			&item.Weight,
			&item.LastOffenseAt,
		); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Falha ao escanear linha de erro"})
			return
		}
		errorsList = append(errorsList, item)
	}

	c.JSON(http.StatusOK, errorsList)
}

func main() {
	var err error
	db, err = database.Connect(database.Config{
		Host:     "localhost",
		Port:     5433,
		User:     "postgres",
		Password: "devpassword123",
		DBName:   "aet_interview",
		SSLMode:  "disable",
	})
	if err != nil {
		log.Fatalf("Falha crítica ao conectar no PostgreSQL: %v", err)
	}
	defer db.Close()

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
	r.GET("/api/v1/interview/errors", handleGetErrors)

	log.Println("==> AET-ICE rodando na porta 8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Falha crítica ao subir servidor Gin: %v", err)
	}
}