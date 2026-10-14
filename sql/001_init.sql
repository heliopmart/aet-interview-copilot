CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS lexical_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(64) NOT NULL,
    trigger_keywords TEXT[] NOT NULL,
    action_verbs TEXT[] NOT NULL,
    precision_adjectives TEXT[] NOT NULL,
    framework_sentence_starter TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS interview_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(32) NOT NULL CHECK (category IN ('TECHNICAL_BACKEND', 'CONCURRENCY', 'SYSTEM_DESIGN', 'BEHAVIORAL_STAR', 'PERSONAL')),
    question_text TEXT NOT NULL,
    target_topics TEXT[] NOT NULL,
    expected_key_points TEXT[] NOT NULL
);

CREATE TABLE IF NOT EXISTS user_interview_logs (
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

CREATE TABLE IF NOT EXISTS interview_errors (
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

CREATE INDEX IF NOT EXISTS idx_interview_errors_weight ON interview_errors (weight DESC, reoffense_count DESC);

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