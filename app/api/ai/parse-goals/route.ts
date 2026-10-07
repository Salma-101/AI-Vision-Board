import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseGoalsWithGemini } from '@/lib/gemini-service';
import { GoalCategory, GoalPriority } from '@/lib/types';

const MAX_INPUT_LENGTH = 2000;

const RequestSchema = z.object({
  input: z.string().min(10, 'Input must be at least 10 characters').max(MAX_INPUT_LENGTH, `Input must be at most ${MAX_INPUT_LENGTH} characters`),
});

const PRIORITY_MAP: Record<number, GoalPriority> = {
  1: 'low',
  2: 'low',
  3: 'medium',
  4: 'high',
  5: 'high',
};

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validation = RequestSchema.safeParse(body);
  if (!validation.success) {
    const message = validation.error.issues[0]?.message ?? 'Invalid request';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    const { goals: geminiGoals } = await parseGoalsWithGemini(validation.data.input);

    const goals = geminiGoals.map((g) => ({
      category: g.category as GoalCategory,
      title: g.title,
      description: g.description,
      priority: PRIORITY_MAP[g.priority] ?? 'medium',
      visual_prompt: g.visualConcept,
    }));

    return NextResponse.json({ goals });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to parse goals';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
