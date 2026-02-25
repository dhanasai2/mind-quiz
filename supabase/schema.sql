-- ══════════════════════════════════════════════════════════════
-- MIND MATRIX — Complete Supabase Database Setup (Fresh Install)
-- Run this ONCE in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ══════════════════════════════════════════════════════════════

-- ─── Enable UUID Extension ───────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Events Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  topic TEXT DEFAULT 'General Knowledge',
  difficulty TEXT DEFAULT 'medium',
  question_count INTEGER DEFAULT 10,
  time_per_question INTEGER DEFAULT 30,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  current_question_index INTEGER DEFAULT -1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Questions Table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer INTEGER NOT NULL,
  explanation TEXT DEFAULT '',
  category TEXT DEFAULT '',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Registered Players Table ────────────────────────────────
CREATE TABLE IF NOT EXISTS registered_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  unique_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Participants Table ──────────────────────────────────────
-- score is NUMERIC(8,1) to support decimal scoring (e.g. 7.3 out of 10)
CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  player_id TEXT,
  score NUMERIC(8,1) DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, player_id)
);

-- ─── Answers Table ───────────────────────────────────────────
-- score is NUMERIC(8,1) to match the scoring system (0-10 with one decimal)
CREATE TABLE IF NOT EXISTS answers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer_index INTEGER NOT NULL,
  is_correct BOOLEAN DEFAULT FALSE,
  response_time_ms INTEGER DEFAULT 0,
  score NUMERIC(8,1) DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_id, question_id)
);

-- ─── Indexes for Performance ─────────────────────────────────
-- Optimized for 100+ concurrent participants
CREATE INDEX IF NOT EXISTS idx_events_code ON events(code);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_questions_event ON questions(event_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(event_id, order_index);
CREATE INDEX IF NOT EXISTS idx_participants_event ON participants(event_id);
CREATE INDEX IF NOT EXISTS idx_participants_score ON participants(event_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_participants_player_id ON participants(event_id, player_id);
CREATE INDEX IF NOT EXISTS idx_answers_event ON answers(event_id);
CREATE INDEX IF NOT EXISTS idx_answers_participant ON answers(participant_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_lookup ON answers(event_id, question_id, participant_id);
CREATE INDEX IF NOT EXISTS idx_registered_unique_id ON registered_players(unique_id);
CREATE INDEX IF NOT EXISTS idx_registered_email ON registered_players(email);

-- ─── Atomic Score Increment Function ─────────────────────────
-- Prevents race conditions when 100+ players submit answers at the same time.
-- Called via supabase.rpc('increment_score', { row_id, amount })
CREATE OR REPLACE FUNCTION increment_score(row_id UUID, amount NUMERIC)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE participants
  SET score = score + amount
  WHERE id = row_id;
END;
$$;

-- ─── Row Level Security (RLS) ────────────────────────────────
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE registered_players ENABLE ROW LEVEL SECURITY;

-- Events policies
CREATE POLICY "Allow public read events" ON events
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert events" ON events
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update events" ON events
  FOR UPDATE USING (true);
CREATE POLICY "Allow public delete events" ON events
  FOR DELETE USING (true);

-- Questions policies
CREATE POLICY "Allow public read questions" ON questions
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert questions" ON questions
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete questions" ON questions
  FOR DELETE USING (true);

-- Participants policies
CREATE POLICY "Allow public read participants" ON participants
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert participants" ON participants
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update participants" ON participants
  FOR UPDATE USING (true);
CREATE POLICY "Allow public delete participants" ON participants
  FOR DELETE USING (true);

-- Answers policies
CREATE POLICY "Allow public read answers" ON answers
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert answers" ON answers
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete answers" ON answers
  FOR DELETE USING (true);

-- Registered players policies
CREATE POLICY "Allow public read registered_players" ON registered_players
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert registered_players" ON registered_players
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update registered_players" ON registered_players
  FOR UPDATE USING (true);
CREATE POLICY "Allow public delete registered_players" ON registered_players
  FOR DELETE USING (true);

-- ─── Function Permissions ────────────────────────────────────
GRANT EXECUTE ON FUNCTION increment_score(UUID, NUMERIC) TO anon;
GRANT EXECUTE ON FUNCTION increment_score(UUID, NUMERIC) TO authenticated;

-- ─── Realtime ────────────────────────────────────────────────
-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE participants;
ALTER PUBLICATION supabase_realtime ADD TABLE answers;
ALTER PUBLICATION supabase_realtime ADD TABLE events;

-- ─── Done! ───────────────────────────────────────────────────
-- Your Mind Matrix database is ready.
-- Now configure your .env file with:
--   VITE_SUPABASE_URL=<your-supabase-url>
--   VITE_SUPABASE_ANON_KEY=<your-anon-key>
--   VITE_GROQ_API_KEY=<your-groq-api-key>
--   VITE_ADMIN_PASSWORD=<your-admin-password>
