import { ParsedGoal, VisualConcept, GoalCategory } from './types';

interface GoalParseResult {
  goals: ParsedGoal[];
}

interface VisualConceptResult {
  concepts: VisualConcept[];
}

const VISUAL_PROMPTS: Record<GoalCategory, string[]> = {
  career: [
    'A sleek modern desk setup with multiple monitors showing code, warm ambient lighting, glass office overlooking a city skyline at dusk',
    'A minimalist workspace with a laptop, notebook, and coffee, large windows with natural light, Scandinavian design aesthetic',
    'A modern corporate office interior with floor-to-ceiling windows, contemporary furniture, and city views at golden hour',
  ],
  finance: [
    'A elegant financial district skyline at sunset with glass towers reflecting golden light, aerial cityscape view',
    'A modern home office with financial charts on screens, a leather chair, and warm wood accents, professional and clean',
    'A serene minimalist study with an open ledger, fountain pen, and brass desk lamp on a walnut desk, soft natural light',
  ],
  travel: [
    'A breathtaking aerial view of Seoul at night with the Han River winding through illuminated skyscrapers, vibrant city lights',
    'A tranquil traditional Korean palace with curved tile roofs surrounded by autumn maple trees, golden hour lighting',
    'A modern airport terminal interior with large windows showing planes at dawn, warm light, travel atmosphere',
  ],
  home: [
    'A beautiful modern apartment living room with large windows, neutral tones, indoor plants, and soft natural daylight',
    'A cozy minimalist bedroom with linen bedding, a reading nook by the window, and warm ambient lighting at dusk',
    'An elegant kitchen with marble countertops, brass fixtures, and open shelving, morning light streaming through windows',
  ],
  wellness: [
    'A serene yoga studio with bamboo flooring, large windows overlooking a misty forest, soft morning light and meditation cushions',
    'A tranquil zen garden with raked sand, carefully placed stones, and a small waterfall, peaceful morning atmosphere',
    'A modern minimalist bathroom with a freestanding tub, eucalyptus plants, and soft diffused light, spa-like ambiance',
  ],
  learning: [
    'A cozy reading nook with floor-to-ceiling bookshelves, a leather armchair, and warm lamplight, stacks of books nearby',
    'A modern library interior with long oak tables, green banker lamps, and rows of books disappearing into the distance',
    'A minimalist study desk with an open notebook, fountain pen, steaming tea, and a single orchid, soft morning light',
  ],
  hobbies: [
    'An artist studio with canvases, paintbrushes in jars, and an easel by a large window, creative and warm atmosphere',
    'A music room with a grand piano by a window overlooking a garden, warm afternoon light casting shadows on the keys',
    'A pottery studio with a wheel, clay works in progress on wooden shelves, and soft natural light from skylights',
  ],
  lifestyle: [
    'A serene morning scene with a journal, fresh coffee, and a vase of wildflowers on a linen-covered table by a sunny window',
    'A minimalist living space with a single armchair, a stack of books, and a large plant, soft diffused light, calm aesthetic',
    'A beautiful patio with string lights, outdoor furniture, and potted herbs at twilight, warm and inviting ambiance',
  ],
  other: [
    'An inspirational mountain summit view at sunrise with clouds below the peaks, golden light spreading across the landscape',
    'A winding path through a misty forest at dawn with light rays filtering through tall trees, mysterious and hopeful',
    'A vast ocean horizon at golden hour with calm waters reflecting the sky, serene and expansive',
  ],
};

function pickPrompt(category: GoalCategory, seed: number): string {
  const prompts = VISUAL_PROMPTS[category];
  return prompts[seed % prompts.length];
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

export async function generateVisualConcepts(
  goals: { id: string; category: GoalCategory; title: string; visual_prompt: string | null }[]
): Promise<VisualConceptResult> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const concepts: VisualConcept[] = goals.map((goal) => ({
    goalId: goal.id,
    prompt: goal.visual_prompt || pickPrompt(goal.category, 0),
    category: goal.category,
    keywords: goal.title.toLowerCase().split(/\s+/).slice(0, 5),
  }));

  return { concepts };
}

export async function generateBoardLayout(
  goals: { id: string; category: GoalCategory; title: string; visual_prompt: string | null }[]
): Promise<{ goals: { id: string; x: number; y: number; width: number; height: number }[] }> {
  await new Promise((resolve) => setTimeout(resolve, 800));

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
