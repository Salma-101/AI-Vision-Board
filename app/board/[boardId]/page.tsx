'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, X, ListChecks, Plus, Check, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getBoard, getGoals, getBoardElements, saveBoardElements, updateBoard, createGeneratedAsset, createGenerationJob, updateGenerationJob, getStepsForGoals, createGoalStep, updateGoalStep, deleteGoalStep } from '@/lib/db';
import { generateBoardLayout, generateVisualConcepts, searchGoalImages } from '@/lib/ai-service';
import { Board, Goal, GoalStep, BoardElement, CATEGORY_COLORS } from '@/lib/types';
import { useEditorStore } from '@/lib/editor-store';
import BoardCanvas from '@/components/editor/board-canvas';
import EditorToolbar from '@/components/editor/editor-toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const TAPE_COLORS = [
  'rgba(200,200,200,0.35)',
  'rgba(210,200,180,0.35)',
  'rgba(190,210,200,0.35)',
  'rgba(210,190,200,0.35)',
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const STOCK_IMAGES_BY_CATEGORY: Record<string, string[]> = {
  career: [
    'https://images.pexels.com/photos/20540999/pexels-photo-20540999.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/1616105/pexels-photo-1616105.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  finance: [
    'https://images.pexels.com/photos/210307/pexels-photo-210307.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/351264/pexels-photo-351264.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  travel: [
    'https://images.pexels.com/photos/1714456/pexels-photo-1714456.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/2703825/pexels-photo-2703825.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  home: [
    'https://images.pexels.com/photos/2889618/pexels-photo-2889618.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/36252681/pexels-photo-36252681.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  wellness: [
    'https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  learning: [
    'https://images.pexels.com/photos/6789634/pexels-photo-6789634.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/38094569/pexels-photo-38094569.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  hobbies: [
    'https://images.pexels.com/photos/1186577/pexels-photo-1186577.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/164763/pexels-photo-164763.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  lifestyle: [
    'https://images.pexels.com/photos/13291016/pexels-photo-13291016.jpeg?auto=compress&cs=tinysrgb&w=600',
    'https://images.pexels.com/photos/37895768/pexels-photo-37895768.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
  other: [
    'https://images.pexels.com/photos/11888493/pexels-photo-11888493.jpeg?auto=compress&cs=tinysrgb&w=600',
  ],
};

export default function BoardEditorPage({ params }: { params: { boardId: string } }) {
  const { boardId } = params;
  const router = useRouter();
  const { user, loading } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stepsByGoal, setStepsByGoal] = useState<Record<string, GoalStep[]>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });
  const [drawerGoal, setDrawerGoal] = useState<Goal | null>(null);
  const [newStepText, setNewStepText] = useState('');
  const [editingStep, setEditingStep] = useState<{ stepId: string; text: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const {
    elements,
    setElements,
    addElement,
    loadFromDB,
    setBackgroundColor,
    commitHistory,
    resetHistory,
  } = useEditorStore();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (boardId && user) {
      loadData();
    }
  }, [boardId, user]);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const loadData = async () => {
    setLoadingData(true);
    const [boardData, goalsData, elementsData] = await Promise.all([
      getBoard(boardId),
      getGoals(boardId),
      getBoardElements(boardId),
    ]);
    setBoard(boardData);
    setGoals(goalsData);
    if (boardData) {
      setBackgroundColor(boardData.background_color || '#f5f0e8');
    }
    if (goalsData.length > 0) {
      const steps = await getStepsForGoals(goalsData.map((g) => g.id));
      setStepsByGoal(steps);
      updateGoalCardProgress(steps);
    }
    if (elementsData.length > 0) {
      loadFromDB(elementsData);
      setGenerated(true);
    } else {
      setElements([]);
      resetHistory();
    }
    setLoadingData(false);
  };

  const updateGoalCardProgress = (steps: Record<string, GoalStep[]>) => {
    const { elements: currentElements, updateElementProperties } = useEditorStore.getState();
    for (const el of currentElements) {
      if (el.type === 'goal_card' && el.properties.goalId) {
        const goalSteps = steps[el.properties.goalId] || [];
        updateElementProperties(el.id, {
          goalStepCompleted: goalSteps.filter((s) => s.completed).length,
          goalStepTotal: goalSteps.length,
          goalDescription: goals.find((g) => g.id === el.properties.goalId)?.description ?? undefined,
        });
      }
    }
  };

  const handleGenerate = async () => {
    if (goals.length === 0) {
      toast.error('No goals to generate visuals for.');
      return;
    }
    setGenerating(true);
    setGenError(null);

    try {
      const job = await createGenerationJob(boardId, goals.length);

      const layout = generateBoardLayout(
        goals.map((g) => ({
          id: g.id,
          category: g.category,
          title: g.title,
          visual_prompt: g.visual_prompt,
        }))
      );

      const concepts = generateVisualConcepts(
        goals.map((g) => ({
          id: g.id,
          category: g.category,
          title: g.title,
          visual_prompt: g.visual_prompt,
        }))
      );

      const newElements: BoardElement[] = [];
      let completedCount = 0;

      for (let i = 0; i < goals.length; i++) {
        const goal = goals[i];
        const layoutItem = layout.goals.find((l) => l.id === goal.id);
        if (!layoutItem) continue;

        const searchQuery = concepts.concepts[i]?.prompt || goal.visual_prompt || goal.title;
        let imageUrl: string;
        try {
          const result = await searchGoalImages(searchQuery, goal.category);
          imageUrl = result.images[0]?.url || '';
        } catch {
          throw new Error('Failed to search for images. Please try again.');
        }

        if (!imageUrl) {
          throw new Error(`No images found for goal: ${goal.title}`);
        }

        const asset = await createGeneratedAsset({
          goal_id: goal.id,
          prompt: searchQuery,
          model: 'pexels-search',
          storage_url: imageUrl,
          category: goal.category,
        });

        const maxZ = Math.max(...newElements.map((e) => e.z_index), 0);
        const imgRotation = (seededRandom(i + 1) - 0.5) * 8;
        const tapeColor = TAPE_COLORS[i % TAPE_COLORS.length];

        const imgWidth = layoutItem.width;
        const imgHeight = Math.round(layoutItem.height * 0.65);

        newElements.push({
          id: crypto.randomUUID(),
          board_id: boardId,
          user_id: user!.id,
          type: 'image',
          asset_id: asset?.id ?? null,
          x: layoutItem.x + (seededRandom(i + 10) - 0.5) * 20,
          y: layoutItem.y + (seededRandom(i + 20) - 0.5) * 15,
          width: imgWidth,
          height: imgHeight,
          rotation: imgRotation,
          z_index: maxZ + 1,
          properties: {
            src: imageUrl,
            cornerRadius: 2,
            shadowColor: 'black',
            shadowBlur: 24,
            shadowOpacity: 0.18,
            shadowOffsetY: 8,
            tapeColor,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        const cardWidth = layoutItem.width;
        const cardHeight = 120;
        const cardRotation = (seededRandom(i + 30) - 0.5) * 4;
        const goalSteps = stepsByGoal[goal.id] || [];

        newElements.push({
          id: crypto.randomUUID(),
          board_id: boardId,
          user_id: user!.id,
          type: 'goal_card',
          asset_id: null,
          x: layoutItem.x,
          y: layoutItem.y + imgHeight + 8,
          width: cardWidth,
          height: cardHeight,
          rotation: cardRotation,
          z_index: maxZ + 2,
          properties: {
            goalId: goal.id,
            goalTitle: goal.title,
            goalCategory: goal.category,
            goalPriority: goal.priority,
            goalDescription: goal.description ?? undefined,
            goalStepCompleted: goalSteps.filter((s) => s.completed).length,
            goalStepTotal: goalSteps.length,
            backgroundColor: '#ffffff',
            borderColor: CATEGORY_COLORS[goal.category],
            padding: 16,
            tapeColor: TAPE_COLORS[(i + 1) % TAPE_COLORS.length],
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        completedCount++;
        if (job) {
          await updateGenerationJob(job.id, { completed_count: completedCount });
        }
      }

      setElements(newElements);
      resetHistory();
      setGenerated(true);

      if (job) {
        await updateGenerationJob(job.id, { status: 'completed', completed_count: completedCount });
      }

      toast.success(`Generated ${goals.length} visual elements!`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generation failed. Please try again.';
      setGenError(message);
      toast.error(message);
    }
    setGenerating(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const success = await saveBoardElements(boardId, elements);
    if (board) {
      await updateBoard(boardId, { background_color: useEditorStore.getState().backgroundColor });
    }
    setSaving(false);
    if (success) {
      toast.success('Board saved');
    } else {
      toast.error('Could not save board.');
    }
  };

  const handleRenameBoard = async (newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    const success = await updateBoard(boardId, { title: trimmed });
    if (success) {
      setBoard((prev) => prev ? { ...prev, title: trimmed } : prev);
      toast.success('Board renamed');
    } else {
      toast.error('Could not rename board.');
    }
  };

  const handleAddText = () => {
    const maxZ = Math.max(...elements.map((e) => e.z_index), 0);
    addElement({
      id: crypto.randomUUID(),
      board_id: boardId,
      user_id: user?.id ?? '',
      type: 'text',
      asset_id: null,
      x: 100,
      y: 100,
      width: 200,
      height: 40,
      rotation: (Math.random() - 0.5) * 6,
      z_index: maxZ + 1,
      properties: {
        text: 'Double-click to edit',
        fontSize: 24,
        fontFamily: 'Inter, sans-serif',
        fill: '#1a1a1a',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    toast.success('Text added');
  };

  const handleAddImage = (src: string) => {
    const maxZ = Math.max(...elements.map((e) => e.z_index), 0);
    addElement({
      id: crypto.randomUUID(),
      board_id: boardId,
      user_id: user?.id ?? '',
      type: 'image',
      asset_id: null,
      x: 150,
      y: 150,
      width: 250,
      height: 250,
      rotation: (Math.random() - 0.5) * 8,
      z_index: maxZ + 1,
      properties: {
        src,
        cornerRadius: 2,
        shadowColor: 'black',
        shadowBlur: 20,
        shadowOpacity: 0.15,
        shadowOffsetY: 6,
        tapeColor: TAPE_COLORS[Math.floor(Math.random() * TAPE_COLORS.length)],
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    toast.success('Image added');
  };

  const handleOpenGoal = useCallback((goalId: string) => {
    const goal = goals.find((g) => g.id === goalId);
    if (goal) setDrawerGoal(goal);
  }, [goals]);

  const refreshSteps = async (goalId: string) => {
    const allSteps = await getStepsForGoals([goalId]);
    setStepsByGoal((prev) => ({ ...prev, ...allSteps }));
    updateGoalCardProgress({ ...stepsByGoal, ...allSteps });
  };

  const handleAddStep = async () => {
    if (!drawerGoal || !newStepText.trim()) return;
    const existing = stepsByGoal[drawerGoal.id] || [];
    if (existing.length >= 5) {
      toast.error('Each goal can have at most 5 action steps.');
      return;
    }
    const step = await createGoalStep(drawerGoal.id, newStepText.trim(), existing.length);
    if (step) {
      await refreshSteps(drawerGoal.id);
      setNewStepText('');
    }
  };

  const handleToggleStep = async (stepId: string, completed: boolean) => {
    if (!drawerGoal) return;
    await updateGoalStep(stepId, { completed: !completed });
    await refreshSteps(drawerGoal.id);
  };

  const handleSaveStepEdit = async (stepId: string) => {
    if (!drawerGoal || !editingStep) return;
    await updateGoalStep(stepId, { text: editingStep.text.trim() });
    await refreshSteps(drawerGoal.id);
    setEditingStep(null);
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!drawerGoal) return;
    await deleteGoalStep(stepId);
    await refreshSteps(drawerGoal.id);
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const drawerSteps = drawerGoal ? (stepsByGoal[drawerGoal.id] || []) : [];

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <EditorToolbar
        boardTitle={board?.title ?? 'Vision Board'}
        onBack={() => router.back()}
        onSave={handleSave}
        onAddText={handleAddText}
        onAddImage={handleAddImage}
        onRenameBoard={handleRenameBoard}
        saving={saving}
      />

      <div ref={containerRef} className="absolute inset-0">
        <BoardCanvas width={containerSize.width} height={containerSize.height} onOpenGoal={handleOpenGoal} />
      </div>

      {!generated && !generating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="max-w-md text-center px-6 animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary mx-auto mb-6">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-3">Generate your vision board</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              We&apos;ll transform your {goals.length} {goals.length === 1 ? 'goal' : 'goals'} into visual elements
              arranged on your board. Each element stays independently editable.
            </p>
            <button
              onClick={handleGenerate}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-foreground px-8 text-sm font-medium text-background hover:bg-foreground/90 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              Generate visuals
            </button>
          </div>
        </div>
      )}

      {generating && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center animate-fade-in">
            <Loader2 className="h-12 w-12 animate-spin text-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Generating your vision...</h2>
            <p className="text-muted-foreground">Creating visual elements for your goals</p>
          </div>
        </div>
      )}

      {/* Goal detail drawer */}
      {drawerGoal && (
        <div className="absolute inset-0 z-30 flex justify-end" onClick={() => setDrawerGoal(null)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="relative w-full max-w-md h-full bg-background border-l border-border shadow-2xl overflow-y-auto animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background/90 backdrop-blur-md border-b border-border px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: CATEGORY_COLORS[drawerGoal.category] }}
                >
                  {drawerGoal.category}
                </span>
              </div>
              <button onClick={() => setDrawerGoal(null)} className="rounded-lg p-1.5 hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-6">
              <h2 className="text-2xl font-semibold tracking-tight mb-2">{drawerGoal.title}</h2>
              {drawerGoal.description && (
                <p className="text-muted-foreground text-base leading-relaxed mb-6">{drawerGoal.description}</p>
              )}

              <div className="border-t border-border pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <ListChecks className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-medium">Action Steps</h3>
                  {drawerSteps.length > 0 && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {drawerSteps.filter((s) => s.completed).length}/{drawerSteps.length} complete
                    </span>
                  )}
                </div>

                {drawerSteps.length > 0 && (
                  <div className="h-2 rounded-full bg-secondary overflow-hidden mb-4">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(drawerSteps.filter((s) => s.completed).length / drawerSteps.length) * 100}%`,
                        backgroundColor: CATEGORY_COLORS[drawerGoal.category],
                      }}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  {drawerSteps.map((step) => (
                    <div key={step.id} className="flex items-center gap-2 group rounded-lg p-1.5 hover:bg-secondary/50 transition-colors">
                      <Checkbox
                        checked={step.completed}
                        onCheckedChange={() => handleToggleStep(step.id, step.completed)}
                      />
                      {editingStep?.stepId === step.id ? (
                        <div className="flex-1 flex gap-1">
                          <Input
                            value={editingStep.text}
                            onChange={(e) => setEditingStep({ ...editingStep, text: e.target.value })}
                            className="h-7 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveStepEdit(step.id);
                              if (e.key === 'Escape') setEditingStep(null);
                            }}
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveStepEdit(step.id)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingStep(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className={`flex-1 text-sm ${step.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {step.text}
                          </span>
                          <button
                            onClick={() => setEditingStep({ stepId: step.id, text: step.text })}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDeleteStep(step.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}

                  {drawerSteps.length < 5 && (
                    <div className="flex items-center gap-2 pt-2">
                      <Plus className="h-4 w-4 text-muted-foreground" />
                      <Input
                        value={newStepText}
                        onChange={(e) => setNewStepText(e.target.value)}
                        placeholder="Add an action step..."
                        className="h-8 text-sm border-none px-0 focus-visible:ring-0"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddStep();
                        }}
                      />
                      {newStepText.trim() && (
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleAddStep}>
                          Add
                        </Button>
                      )}
                    </div>
                  )}

                  {drawerSteps.length === 0 && (
                    <p className="text-xs text-muted-foreground italic pl-6">
                      Add 2-5 concrete steps you will take to achieve this goal.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
