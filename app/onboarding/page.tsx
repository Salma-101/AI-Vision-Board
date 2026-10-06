'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, ArrowRight, ArrowLeft, Loader2, Lightbulb } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { parseGoalsFromText } from '@/lib/ai-service';
import { createBoard, createGoals } from '@/lib/db';
import { ParsedGoal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const categoryChips = [
  { label: 'Career', emoji: 'Briefcase' },
  { label: 'Finance', emoji: 'Wallet' },
  { label: 'Travel', emoji: 'Plane' },
  { label: 'Home', emoji: 'Home' },
  { label: 'Wellness', emoji: 'Heart' },
  { label: 'Learning', emoji: 'Book' },
  { label: 'Hobbies', emoji: 'Palette' },
  { label: 'Lifestyle', emoji: 'Sparkles' },
];

const examples = [
  'I want to graduate, get a software engineering job, travel to Seoul, create a beautiful apartment and become financially independent.',
  'I want to run a marathon, learn Japanese, save $50,000, and visit Japan next spring.',
  'I want to start my own business, buy a house with a garden, read 20 books this year, and learn to play the piano.',
];

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [text, setText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parsedGoals, setParsedGoals] = useState<ParsedGoal[] | null>(null);
  const [boardId, setBoardId] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const existingBoardId = searchParams.get('board');
    if (existingBoardId) {
      setBoardId(existingBoardId);
    }
  }, [searchParams]);

  const handleParse = async () => {
    if (text.trim().length < 10) {
      toast.error('Please describe your goals in a bit more detail.');
      return;
    }
    setParsing(true);
    try {
      let currentBoardId = boardId;
      if (!currentBoardId) {
        const board = await createBoard('My Vision Board');
        if (!board) {
          toast.error('Could not create a board. Please try again.');
          setParsing(false);
          return;
        }
        currentBoardId = board.id;
        setBoardId(board.id);
      }

      const result = await parseGoalsFromText(text);
      setParsedGoals(result.goals);
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    }
    setParsing(false);
  };

  const handleContinue = async () => {
    if (!parsedGoals || !boardId) return;

    const goals = await createGoals(boardId, parsedGoals.map((g) => ({
      category: g.category,
      title: g.title,
      description: g.description,
      priority: g.priority,
      visual_prompt: g.visual_prompt,
    })));

    if (goals.length === 0) {
      toast.error('Could not save goals. Please try again.');
      return;
    }

    router.push(`/goals/${boardId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <div className="flex items-center gap-2 mb-12">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Visionary</span>
        </div>

        {!parsedGoals && (
          <div className="animate-fade-in">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-balance mb-4">
              What do you want to achieve?
            </h1>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Describe the life you want to build in your own words. Don&apos;t worry
              about structure — just write what comes to mind.
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {categoryChips.map((cat) => (
                <span
                  key={cat.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                >
                  {cat.label}
                </span>
              ))}
            </div>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="I want to graduate, get a software engineering job, travel to Seoul, create a beautiful apartment and become financially independent..."
              className="min-h-[160px] text-base resize-none"
              autoFocus
            />

            <div className="mt-4 space-y-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5" />
                Need inspiration? Try one of these:
              </p>
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setText(ex)}
                  className="block w-full text-left text-sm text-muted-foreground hover:text-foreground rounded-lg border border-border/60 bg-card px-4 py-2.5 transition-colors hover:border-border"
                >
                  {ex}
                </button>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <Button onClick={handleParse} disabled={parsing || text.trim().length < 10} size="lg" className="gap-2">
                {parsing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing your goals...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {parsedGoals && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <Sparkles className="h-4 w-4" />
              We identified {parsedGoals.length} {parsedGoals.length === 1 ? 'goal' : 'goals'} from your description
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2">Here&apos;s what we found</h1>
            <p className="text-muted-foreground mb-8">
              Take a look — you can edit any of these before we create your board.
            </p>

            <div className="space-y-3 mb-8">
              {parsedGoals.map((goal, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-card p-5 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize text-foreground">
                      {goal.category}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground capitalize">{goal.priority} priority</span>
                  </div>
                  <h3 className="font-semibold text-base mb-1">{goal.title}</h3>
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => setParsedGoals(null)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Edit description
              </Button>
              <Button onClick={handleContinue} size="lg" className="gap-2">
                Review goals
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
