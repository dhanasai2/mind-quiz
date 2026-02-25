-- ══════════════════════════════════════════════════════════════
-- MIND MATRIX — Migration: Fix score column type + add atomic increment
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- REQUIRED for correct scoring and 100+ participant support
-- ══════════════════════════════════════════════════════════════

-- 1. Change score columns from INTEGER to NUMERIC to support decimal scores (e.g. 7.3)
ALTER TABLE participants ALTER COLUMN score TYPE NUMERIC(8,1) USING score::numeric(8,1);
ALTER TABLE participants ALTER COLUMN score SET DEFAULT 0;

ALTER TABLE answers ALTER COLUMN score TYPE NUMERIC(8,1) USING score::numeric(8,1);
ALTER TABLE answers ALTER COLUMN score SET DEFAULT 0;

-- 2. Create atomic score increment function
--    This prevents race conditions when 100+ players submit answers simultaneously.
--    Without this, two concurrent UPDATE SET score = X could overwrite each other.
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

-- 3. Grant execute permission to anonymous users (since game uses anon key)
GRANT EXECUTE ON FUNCTION increment_score(UUID, NUMERIC) TO anon;
GRANT EXECUTE ON FUNCTION increment_score(UUID, NUMERIC) TO authenticated;

-- Done! Scores now support decimals and increment atomically.
