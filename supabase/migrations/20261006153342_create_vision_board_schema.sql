/*
# Vision Board App Schema

## Overview
Creates the full database schema for an AI-powered visual goals and vision-board web app.
Users describe goals in natural language, the app converts them to structured goals,
and arranges visual elements on an editable board.

## New Tables
1. boards - vision boards (id, user_id, title, description, background_color, timestamps)
2. goals - structured goals (id, board_id, user_id, category, title, description, priority, completed, visual_prompt, timestamps)
3. generated_assets - generated images (id, user_id, goal_id, prompt, model, storage_url, category, created_at)
4. board_elements - editable elements on a board (id, board_id, user_id, type, asset_id, x, y, width, height, rotation, z_index, properties, timestamps)
5. generation_jobs - tracks generation pipeline (id, user_id, board_id, status, total, completed_count, error, timestamps)

## Security
- RLS enabled on all tables.
- Owner-scoped CRUD: each authenticated user can only access rows where user_id = auth.uid().
*/

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  background_color text DEFAULT '#fafaf9',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE boards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_boards" ON boards;
CREATE POLICY "select_own_boards" ON boards FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_boards" ON boards;
CREATE POLICY "insert_own_boards" ON boards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_boards" ON boards;
CREATE POLICY "update_own_boards" ON boards FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_boards" ON boards;
CREATE POLICY "delete_own_boards" ON boards FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  priority text DEFAULT 'medium',
  completed boolean DEFAULT false,
  visual_prompt text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_goals" ON goals;
CREATE POLICY "select_own_goals" ON goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_goals" ON goals;
CREATE POLICY "insert_own_goals" ON goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_goals" ON goals;
CREATE POLICY "update_own_goals" ON goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_goals" ON goals;
CREATE POLICY "delete_own_goals" ON goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS generated_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  model text DEFAULT 'mock',
  storage_url text,
  category text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE generated_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_assets" ON generated_assets;
CREATE POLICY "select_own_assets" ON generated_assets FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_assets" ON generated_assets;
CREATE POLICY "insert_own_assets" ON generated_assets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_assets" ON generated_assets;
CREATE POLICY "update_own_assets" ON generated_assets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_assets" ON generated_assets;
CREATE POLICY "delete_own_assets" ON generated_assets FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS board_elements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  asset_id uuid REFERENCES generated_assets(id) ON DELETE CASCADE,
  x double precision DEFAULT 0,
  y double precision DEFAULT 0,
  width double precision DEFAULT 200,
  height double precision DEFAULT 200,
  rotation double precision DEFAULT 0,
  z_index integer DEFAULT 0,
  properties jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE board_elements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_elements" ON board_elements;
CREATE POLICY "select_own_elements" ON board_elements FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_elements" ON board_elements;
CREATE POLICY "insert_own_elements" ON board_elements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_elements" ON board_elements;
CREATE POLICY "update_own_elements" ON board_elements FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_elements" ON board_elements;
CREATE POLICY "delete_own_elements" ON board_elements FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  board_id uuid REFERENCES boards(id) ON DELETE CASCADE,
  status text DEFAULT 'queued',
  total integer DEFAULT 0,
  completed_count integer DEFAULT 0,
  error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_jobs" ON generation_jobs;
CREATE POLICY "select_own_jobs" ON generation_jobs FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_jobs" ON generation_jobs;
CREATE POLICY "insert_own_jobs" ON generation_jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_jobs" ON generation_jobs;
CREATE POLICY "update_own_jobs" ON generation_jobs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_jobs" ON generation_jobs;
CREATE POLICY "delete_own_jobs" ON generation_jobs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_board_id ON goals(board_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_board_elements_board_id ON board_elements(board_id);
CREATE INDEX IF NOT EXISTS idx_board_elements_user_id ON board_elements(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_assets_user_id ON generated_assets(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_assets_goal_id ON generated_assets(goal_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_user_id ON generation_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_board_id ON generation_jobs(board_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_boards_updated_at ON boards;
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_goals_updated_at ON goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_board_elements_updated_at ON board_elements;
CREATE TRIGGER update_board_elements_updated_at BEFORE UPDATE ON board_elements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_generation_jobs_updated_at ON generation_jobs;
CREATE TRIGGER update_generation_jobs_updated_at BEFORE UPDATE ON generation_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
