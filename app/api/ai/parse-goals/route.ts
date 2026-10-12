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

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const clientId = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'anonymous';

  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    );
  }

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

    const seenTitles = new Set<string>();
    const goals = geminiGoals
      .filter((g) => {
        const lower = g.title.toLowerCase();
        if (seenTitles.has(lower)) return false;
        seenTitles.add(lower);
        return true;
      })
      .map((g) => ({
        category: g.category as GoalCategory,
        title: g.title,
        description: g.description,
        priority: PRIORITY_MAP[g.priority] ?? 'medium',
        visual_prompt: g.visualConcept,
      }));

    if (goals.length === 0) {
      return NextResponse.json(
        { error: 'No valid goals could be parsed from your input. Please try rephrasing.' },
        { status: 422 }
      );
    }

    return NextResponse.json({ goals });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to parse goals';
    if (message.includes('API key')) {
      return NextResponse.json(
        { error: 'The AI service is not properly configured. Please contact support.' },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
