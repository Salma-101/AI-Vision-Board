export type GoalCategory =
  | 'career'
  | 'finance'
  | 'travel'
  | 'home'
  | 'wellness'
  | 'learning'
  | 'hobbies'
  | 'lifestyle'
  | 'other';

export type GoalPriority = 'low' | 'medium' | 'high';

export type ElementType = 'image' | 'text' | 'goal_card' | 'sticker';

export type GenerationStatus = 'queued' | 'generating' | 'completed' | 'failed';

export interface Goal {
  id: string;
  board_id: string;
  user_id: string;
  category: GoalCategory;
  title: string;
  description: string | null;
  priority: GoalPriority;
  completed: boolean;
  visual_prompt: string | null;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  background_color: string;
  created_at: string;
  updated_at: string;
}

export interface BoardElementProperties {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  fontStyle?: string;
  src?: string;
  cornerRadius?: number;
  stroke?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOpacity?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  opacity?: number;
  goalId?: string;
  goalTitle?: string;
  goalCategory?: GoalCategory;
  goalPriority?: GoalPriority;
  backgroundColor?: string;
  borderColor?: string;
  padding?: number;
}

export interface BoardElement {
  id: string;
  board_id: string;
  user_id: string;
  type: ElementType;
  asset_id: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z_index: number;
  properties: BoardElementProperties;
  created_at: string;
  updated_at: string;
}

export interface GeneratedAsset {
  id: string;
  user_id: string;
  goal_id: string | null;
  prompt: string;
  model: string;
  storage_url: string | null;
  category: string | null;
  created_at: string;
}

export interface GenerationJob {
  id: string;
  user_id: string;
  board_id: string | null;
  status: GenerationStatus;
  total: number;
  completed_count: number;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParsedGoal {
  category: GoalCategory;
  title: string;
  description: string;
  priority: GoalPriority;
  visual_prompt: string;
}

export interface VisualConcept {
  goalId: string;
  prompt: string;
  category: GoalCategory;
  keywords: string[];
}

export const GOAL_CATEGORIES: { value: GoalCategory; label: string; icon: string }[] = [
  { value: 'career', label: 'Career', icon: 'Briefcase' },
  { value: 'finance', label: 'Finance', icon: 'Wallet' },
  { value: 'travel', label: 'Travel', icon: 'Plane' },
  { value: 'home', label: 'Home', icon: 'Home' },
  { value: 'wellness', label: 'Wellness', icon: 'HeartPulse' },
  { value: 'learning', label: 'Learning', icon: 'BookOpen' },
  { value: 'hobbies', label: 'Hobbies', icon: 'Palette' },
  { value: 'lifestyle', label: 'Lifestyle', icon: 'Sparkles' },
  { value: 'other', label: 'Other', icon: 'Compass' },
];

export const GOAL_PRIORITIES: { value: GoalPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: '#64748b' },
  { value: 'medium', label: 'Medium', color: '#0ea5e9' },
  { value: 'high', label: 'High', color: '#f97316' },
];

export const CATEGORY_COLORS: Record<GoalCategory, string> = {
  career: '#0ea5e9',
  finance: '#10b981',
  travel: '#f59e0b',
  home: '#ef4444',
  wellness: '#ec4899',
  learning: '#8b5cf6',
  hobbies: '#f97316',
  lifestyle: '#14b8a6',
  other: '#64748b',
};
