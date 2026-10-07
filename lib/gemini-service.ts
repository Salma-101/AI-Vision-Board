import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';

const ALLOWED_CATEGORIES = [
  'career', 'finance', 'travel', 'home',
  'wellness', 'learning', 'hobbies', 'lifestyle', 'other',
] as const;

const GeminiGoalSchema = z.object({
  category: z.enum(ALLOWED_CATEGORIES),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  priority: z.number().int().min(1).max(5),
  visualConcept: z.string().min(1).max(500),
});

const GeminiResponseSchema = z.object({
  goals: z.array(GeminiGoalSchema).min(1).max(20),
});

export type GeminiGoal = z.infer<typeof GeminiGoalSchema>;

const SYSTEM_PROMPT = `You are a goal-parsing assistant. The user describes their life goals in natural language.
Your job is to parse the text into a list of structured goals.

Return ONLY a JSON object with this exact shape:
{
  "goals": [
    {
      "category": "career" | "finance" | "travel" | "home" | "wellness" | "learning" | "hobbies" | "lifestyle" | "other",
      "title": "A short, imperative goal title (max 200 chars)",
      "description": "A one-sentence description of the goal (max 500 chars)",
      "priority": <integer 1-5, where 5 is highest>,
      "visualConcept": "A detailed visual description for generating an image representing this goal"
    }
  ]
}

CRITICAL VISUAL CONSTRAINT: The visualConcept for EVERY goal must NOT contain any of the following:
- people, humans, faces, bodies, hands, portraits, silhouettes, avatars, human figures, human-like characters

Visual concepts MUST instead use inanimate subjects only:
- architecture, interiors, landscapes, cities, travel destinations, objects, technology, workspaces, vehicles, books, food, nature, abstract imagery, typography

Example of a BAD visualConcept: "professional software engineer working at a laptop"
Example of a GOOD visualConcept: "minimalist developer workspace with laptop displaying code, desk setup, architectural city skyline and modern office interior"

Rules:
- Return between 1 and 20 goals.
- Each goal must have a unique title.
- Category must be one of the allowed values.
- Priority must be an integer from 1 (lowest) to 5 (highest).
- Output ONLY the JSON object, no markdown, no explanation.`;

const PRIMARY_MODEL = 'gemini-3.8-flash';
const FALLBACK_MODEL = 'gemini-3.1-flash-lite';

export interface ParsedGoalResult {
  goals: GeminiGoal[];
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  return JSON.parse(cleaned);
}

async function tryGenerate(
  genAI: GoogleGenerativeAI,
  modelName: string,
  fullPrompt: string,
): Promise<ParsedGoalResult> {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 4096,
    },
  });

  const result = await model.generateContent(fullPrompt);
  const text = result.response.text();

  let parsed: unknown;
  try {
    parsed = extractJson(text);
  } catch {
    throw new Error('Gemini returned malformed JSON');
  }

  const validation = GeminiResponseSchema.safeParse(parsed);
  if (!validation.success) {
    throw new Error('Gemini response did not match expected schema');
  }

  return { goals: validation.data.goals };
}

export async function parseGoalsWithGemini(userInput: string): Promise<ParsedGoalResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const fullPrompt = `${SYSTEM_PROMPT}\n\nUser input:\n${userInput}`;

  try {
    return await tryGenerate(genAI, PRIMARY_MODEL, fullPrompt);
  } catch (primaryError) {
    try {
      return await tryGenerate(genAI, FALLBACK_MODEL, fullPrompt);
    } catch {
      throw primaryError;
    }
  }
}
