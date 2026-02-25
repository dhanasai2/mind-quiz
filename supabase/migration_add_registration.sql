-- ══════════════════════════════════════════════════════════════
-- MIND MATRIX — Migration: Add registered_players + update participants
-- Run this in Supabase SQL Editor if you already ran the original schema.sql
-- ══════════════════════════════════════════════════════════════

-- 1. Create registered_players table
CREATE TABLE IF NOT EXISTS registered_players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  unique_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add player_id column to participants (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'player_id'
  ) THEN
    ALTER TABLE participants ADD COLUMN player_id TEXT;
  END IF;
END $$;

-- 3. Drop old unique constraint and add new one
ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_event_id_name_key;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'participants_event_id_player_id_key'
  ) THEN
    ALTER TABLE participants ADD CONSTRAINT participants_event_id_player_id_key UNIQUE(event_id, player_id);
  END IF;
END $$;

-- 4. Add indexes
CREATE INDEX IF NOT EXISTS idx_registered_unique_id ON registered_players(unique_id);
CREATE INDEX IF NOT EXISTS idx_registered_email ON registered_players(email);

-- 5. Enable RLS
ALTER TABLE registered_players ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read registered_players" ON registered_players
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert registered_players" ON registered_players
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update registered_players" ON registered_players
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete registered_players" ON registered_players
  FOR DELETE USING (true);

-- Done! Your database now supports player registration with unique IDs.
