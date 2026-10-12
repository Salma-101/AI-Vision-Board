import { ParsedGoal, VisualConcept, GoalCategory } from './types';

interface GoalParseResult {
  goals: ParsedGoal[];
}

interface VisualConceptResult {
  concepts: VisualConcept[];
}

interface ImageSearchResult {
  images: { url: string; alt: string }[];
  source: 'pexels_api' | 'curated';
}

export class GeminiParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiParseError';
  }
}

export async function parseGoalsFromText(text: string): Promise<GoalParseResult> {
  const response = await fetch('/api/ai/parse-goals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: text }),
  });

  if (!response.ok) {
    let message = 'Failed to parse goals';
    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        message = errorBody.error;
      }
    } catch {
      // response had no JSON body; use default message
    }
    throw new GeminiParseError(message);
  }

  const data = await response.json();
  const goals: ParsedGoal[] = (data.goals as ParsedGoal[]).map((g) => ({
    category: g.category,
    title: g.title,
    description: g.description,
    priority: g.priority,
    visual_prompt: g.visual_prompt,
  }));

  return { goals };
}

export async function searchGoalImages(
  query: string,
  category: GoalCategory,
): Promise<ImageSearchResult> {
  const response = await fetch('/api/ai/search-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, category }),
  });

  if (!response.ok) {
    throw new Error('Image search failed');
  }

  return response.json();
}

export async function generateVisualConcepts(
  goals: { id: string; category: GoalCategory; title: string; visual_prompt: string | null }[]
): Promise<VisualConceptResult> {
  const concepts: VisualConcept[] = goals.map((goal) => ({
    goalId: goal.id,
    prompt: goal.visual_prompt || goal.title,
    category: goal.category,
    keywords: goal.title.toLowerCase().split(/\s+/).slice(0, 5),
  }));

  return { concepts };
}

export function generateBoardLayout(
  goals: { id: string; category: GoalCategory; title: string; visual_prompt: string | null }[]
): { goals: { id: string; x: number; y: number; width: number; height: number }[] } {
  const cols = goals.length <= 3 ? goals.length : Math.min(3, Math.ceil(Math.sqrt(goals.length)));
  const cardWidth = 280;
  const cardHeight = 280;
  const gap = 40;
  const startX = 80;
  const startY = 80;

  const layout = goals.map((goal, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return {
      id: goal.id,
      x: startX + col * (cardWidth + gap),
      y: startY + row * (cardHeight + gap),
      width: cardWidth,
      height: cardHeight,
    };
  });

  return { goals: layout };
}
