'use client';

import { Board, Goal, BoardElement, GeneratedAsset, GenerationJob } from './types';
import { supabase } from './supabase-client';

export async function createBoard(title: string, description?: string): Promise<Board | null> {
  const { data, error } = await supabase
    .from('boards')
    .insert({ title, description })
    .select()
    .single();
  if (error) {
    console.error('Error creating board:', error);
    return null;
  }
  return data as Board;
}

export async function getBoards(): Promise<Board[]> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching boards:', error);
    return [];
  }
  return data as Board[];
}

export async function getBoard(boardId: string): Promise<Board | null> {
  const { data, error } = await supabase
    .from('boards')
    .select('*')
    .eq('id', boardId)
    .maybeSingle();
  if (error) {
    console.error('Error fetching board:', error);
    return null;
  }
  return data as Board | null;
}

export async function updateBoard(boardId: string, updates: Partial<Board>): Promise<boolean> {
  const { error } = await supabase.from('boards').update(updates).eq('id', boardId);
  if (error) {
    console.error('Error updating board:', error);
    return false;
  }
  return true;
}

export async function deleteBoard(boardId: string): Promise<boolean> {
  const { error } = await supabase.from('boards').delete().eq('id', boardId);
  if (error) {
    console.error('Error deleting board:', error);
    return false;
  }
  return true;
}

export async function getGoals(boardId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('board_id', boardId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
  return data as Goal[];
}

export async function createGoals(
  boardId: string,
  goals: { category: string; title: string; description: string; priority: string; visual_prompt: string }[]
): Promise<Goal[]> {
  const rows = goals.map((g) => ({ ...g, board_id: boardId }));
  const { data, error } = await supabase
    .from('goals')
    .insert(rows)
    .select();
  if (error) {
    console.error('Error creating goals:', error);
    return [];
  }
  return data as Goal[];
}

export async function updateGoal(goalId: string, updates: Partial<Goal>): Promise<boolean> {
  const { error } = await supabase.from('goals').update(updates).eq('id', goalId);
  if (error) {
    console.error('Error updating goal:', error);
    return false;
  }
  return true;
}

export async function deleteGoal(goalId: string): Promise<boolean> {
  const { error } = await supabase.from('goals').delete().eq('id', goalId);
  if (error) {
    console.error('Error deleting goal:', error);
    return false;
  }
  return true;
}

export async function getBoardElements(boardId: string): Promise<BoardElement[]> {
  const { data, error } = await supabase
    .from('board_elements')
    .select('*')
    .eq('board_id', boardId)
    .order('z_index', { ascending: true });
  if (error) {
    console.error('Error fetching board elements:', error);
    return [];
  }
  return data as BoardElement[];
}

export async function saveBoardElements(boardId: string, elements: BoardElement[]): Promise<boolean> {
  const { data: existing } = await supabase
    .from('board_elements')
    .select('id')
    .eq('board_id', boardId);
  const existingIds = (existing ?? []).map((e) => e.id);
  const elementIds = elements.map((e) => e.id);
  const toDelete = existingIds.filter((id) => !elementIds.includes(id));

  if (toDelete.length > 0) {
    await supabase.from('board_elements').delete().in('id', toDelete);
  }

  for (const el of elements) {
    const row = {
      id: el.id,
      board_id: boardId,
      type: el.type,
      asset_id: el.asset_id,
      x: el.x,
      y: el.y,
      width: el.width,
      height: el.height,
      rotation: el.rotation,
      z_index: el.z_index,
      properties: el.properties,
    };
    const { error } = await supabase.from('board_elements').upsert(row);
    if (error) {
      console.error('Error upserting element:', error);
    }
  }

  return true;
}

export async function createGeneratedAsset(asset: {
  goal_id: string | null;
  prompt: string;
  model?: string;
  storage_url?: string | null;
  category?: string | null;
}): Promise<GeneratedAsset | null> {
  const { data, error } = await supabase
    .from('generated_assets')
    .insert({
      goal_id: asset.goal_id,
      prompt: asset.prompt,
      model: asset.model ?? 'mock',
      storage_url: asset.storage_url ?? null,
      category: asset.category ?? null,
    })
    .select()
    .single();
  if (error) {
    console.error('Error creating generated asset:', error);
    return null;
  }
  return data as GeneratedAsset;
}

export async function createGenerationJob(boardId: string, total: number): Promise<GenerationJob | null> {
  const { data, error } = await supabase
    .from('generation_jobs')
    .insert({ board_id: boardId, total, status: 'generating' })
    .select()
    .single();
  if (error) {
    console.error('Error creating generation job:', error);
    return null;
  }
  return data as GenerationJob;
}

export async function updateGenerationJob(
  jobId: string,
  updates: Partial<GenerationJob>
): Promise<boolean> {
  const { error } = await supabase.from('generation_jobs').update(updates).eq('id', jobId);
  if (error) {
    console.error('Error updating generation job:', error);
    return false;
  }
  return true;
}
