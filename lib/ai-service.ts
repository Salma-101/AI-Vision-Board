import { ParsedGoal, VisualConcept, GoalCategory } from './types';

interface GoalParseResult {
  goals: ParsedGoal[];
}

interface VisualConceptResult {
  concepts: VisualConcept[];
}

const CATEGORY_KEYWORDS: Record<GoalCategory, string[]> = {
  career: ['job', 'career', 'work', 'company', 'startup', 'business', 'engineer', 'developer', 'manager', 'promotion', 'interview', 'resume', 'salary', 'profession', 'office', 'leadership', 'ceo', 'founder', 'graduation', 'graduate', 'degree'],
  finance: ['money', 'finance', 'financial', 'invest', 'investment', 'savings', 'wealth', 'rich', 'income', 'passive', 'dividend', 'stock', 'budget', 'debt', 'retire', 'retirement', 'independent', 'freedom'],
  travel: ['travel', 'trip', 'visit', 'country', 'city', 'vacation', 'holiday', 'explore', 'world', 'abroad', 'destination', 'seoul', 'tokyo', 'paris', 'bali', 'japan', 'korea', 'europe', 'thailand', 'adventure'],
  home: ['home', 'house', 'apartment', 'condo', 'living', 'space', 'interior', 'design', 'decor', 'room', 'kitchen', 'garden', 'furniture', 'renovation', 'property'],
  wellness: ['health', 'wellness', 'fitness', 'exercise', 'gym', 'meditation', 'yoga', 'mental', 'sleep', 'diet', 'nutrition', 'run', 'marathon', 'weight', 'mindful', 'self-care', 'wellbeing'],
  learning: ['learn', 'learning', 'study', 'course', 'book', 'read', 'reading', 'skill', 'language', 'certification', 'master', 'degree', 'university', 'course', 'education', 'knowledge'],
  hobbies: ['hobby', 'hobbies', 'paint', 'painting', 'music', 'guitar', 'piano', 'photography', 'writing', 'blog', 'cook', 'cooking', 'baking', 'craft', 'garden', 'pottery', 'draw', 'drawing'],
  lifestyle: ['lifestyle', 'minimal', 'simplify', 'routine', 'habit', 'journal', 'morning', 'evening', 'balance', 'quality', 'simple', 'slow', 'intentional', 'purpose', 'meaningful'],
  other: [],
};

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

function detectCategory(text: string): GoalCategory {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[category] = 0;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        scores[category] += 1;
      }
    }
  }

  let bestCategory: GoalCategory = 'other';
  let bestScore = 0;

  for (const [category, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category as GoalCategory;
    }
  }

  return bestCategory;
}

function splitGoals(text: string): string[] {
  const parts = text
    .split(/[,;.]|\band\b/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 3);
  return parts.length > 0 ? parts : [text.trim()];
}

function generateTitle(fragment: string): string {
  const words = fragment.trim().split(/\s+/);
  if (words.length <= 6) {
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  const keyWords = words.filter((w) => !['the', 'a', 'an', 'to', 'and', 'or', 'of', 'in', 'for', 'with', 'my', 'i', 'want'].includes(w.toLowerCase()));
  return keyWords.slice(0, 5).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function pickPrompt(category: GoalCategory, seed: number): string {
  const prompts = VISUAL_PROMPTS[category];
  return prompts[seed % prompts.length];
}

function determinePriority(index: number, total: number): 'low' | 'medium' | 'high' {
  if (total <= 2) return 'high';
  if (index === 0) return 'high';
  if (index < Math.ceil(total / 2)) return 'medium';
  return 'low';
}

export async function parseGoalsFromText(text: string): Promise<GoalParseResult> {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  const fragments = splitGoals(text);
  const goals: ParsedGoal[] = fragments.map((fragment, index) => {
    const category = detectCategory(fragment);
    const title = generateTitle(fragment);
    const priority = determinePriority(index, fragments.length);
    const prompt = pickPrompt(category, index);

    return {
      category,
      title,
      description: fragment,
      priority,
      visual_prompt: prompt,
    };
  });

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
