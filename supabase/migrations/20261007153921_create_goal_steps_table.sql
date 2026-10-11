/*
# Create goal_steps table for action steps

## Purpose
Each goal can have 2-5 concrete action steps that the user defines before generating their board.
Steps can be added, edited, deleted, and marked complete. Progress is displayed on the board.

## New Tables
- `goal_steps`
  - `id` (uuid, primary key)
  - `goal_id` (uuid, foreign key to goals.id, ON DELETE CASCADE)
  - `user_id` (uuid, not null, defaults to auth.uid())
  - `text` (text, the action step description)
  - `completed` (boolean, default false)
  - `position` (integer, for ordering steps within a goal)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

## Security
- Enable RLS on `goal_steps`.
- Owner-scoped CRUD: each authenticated user can only access steps for goals they own.
- Ownership checked via EXISTS subquery on the parent goals table.
*/

CREATE TABLE IF NOT EXISTS goal_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  completed boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE goal_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_goal_steps" ON goal_steps;
CREATE POLICY "select_own_goal_steps"
ON goal_steps FOR SELECT
TO authenticated
USING (
  EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_steps.goal_id AND goals.user_id = auth.uid())
);

DROP POLICY IF EXISTS "insert_own_goal_steps" ON goal_steps;
CREATE POLICY "insert_own_goal_steps"
ON goal_steps FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_steps.goal_id AND goals.user_id = auth.uid())
);

DROP POLICY IF EXISTS "update_own_goal_steps" ON goal_steps;
CREATE POLICY "update_own_goal_steps"
ON goal_steps FOR UPDATE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_steps.goal_id AND goals.user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_steps.goal_id AND goals.user_id = auth.uid())
);

DROP POLICY IF EXISTS "delete_own_goal_steps" ON goal_steps;
CREATE POLICY "delete_own_goal_steps"
ON goal_steps FOR DELETE
TO authenticated
USING (
  EXISTS (SELECT 1 FROM goals WHERE goals.id = goal_steps.goal_id AND goals.user_id = auth.uid())
);

CREATE INDEX IF NOT EXISTS idx_goal_steps_goal_id ON goal_steps(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_steps_position ON goal_steps(goal_id, position);
