'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, ArrowLeft, Plus, Trash2, Pencil, Check, X, Loader2, Wand2, ListChecks, GripVertical } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getGoals, updateGoal, deleteGoal, createGoals, createBoard, getStepsForGoals, createGoalStep, updateGoalStep, deleteGoalStep } from '@/lib/db';
import { Goal, GoalStep, GoalCategory, GoalPriority, GOAL_CATEGORIES, GOAL_PRIORITIES, CATEGORY_COLORS } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface EditState {
  id: string;
  category: GoalCategory;
  title: string;
  description: string;
  priority: GoalPriority;
}

interface StepEditState {
  goalId: string;
  steps: { id?: string; text: string; completed: boolean; position: number }[];
}

export default function GoalReviewPage({ params }: { params: { boardId: string } }) {
  const { boardId } = params;
  const router = useRouter();
  const { user, loading } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stepsByGoal, setStepsByGoal] = useState<Record<string, GoalStep[]>>({});
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [editing, setEditing] = useState<EditState | null>(null);
  const [adding, setAdding] = useState(false);
  const [newGoal, setNewGoal] = useState({ category: 'other' as GoalCategory, title: '', description: '', priority: 'medium' as GoalPriority });
  const [generating, setGenerating] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [newStepText, setNewStepText] = useState<Record<string, string>>({});
  const [editingStep, setEditingStep] = useState<{ stepId: string; text: string } | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (boardId && user) {
      loadGoals();
    }
  }, [boardId, user]);

  const loadGoals = useCallback(async () => {
    setLoadingGoals(true);
    const data = await getGoals(boardId);
    setGoals(data);
    if (data.length > 0) {
      const steps = await getStepsForGoals(data.map((g) => g.id));
      setStepsByGoal(steps);
      setExpandedSteps(new Set(data.map((g) => g.id)));
    }
    setLoadingGoals(false);
  }, [boardId]);

  const handleEditSave = async () => {
    if (!editing) return;
    await updateGoal(editing.id, {
      category: editing.category,
      title: editing.title,
      description: editing.description,
      priority: editing.priority,
    });
    setEditing(null);
    loadGoals();
    toast.success('Goal updated');
  };

  const handleDelete = async (id: string) => {
    await deleteGoal(id);
    loadGoals();
    toast.success('Goal removed');
  };

  const handleAddSave = async () => {
    if (newGoal.title.trim().length === 0) {
      toast.error('Please give your goal a title.');
      return;
    }
    await createGoals(boardId, [{
      category: newGoal.category,
      title: newGoal.title,
      description: newGoal.description,
      priority: newGoal.priority,
      visual_prompt: '',
    }]);
    setAdding(false);
    setNewGoal({ category: 'other', title: '', description: '', priority: 'medium' });
    loadGoals();
    toast.success('Goal added');
  };

  const handleGenerateBoard = async () => {
    if (goals.length === 0) {
      toast.error('Add at least one goal before generating your board.');
      return;
    }
    setGenerating(true);
    router.push(`/board/${boardId}`);
  };

  const toggleSteps = (goalId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });
  };

  const handleAddStep = async (goalId: string) => {
    const text = (newStepText[goalId] || '').trim();
    if (!text) return;
    const existing = stepsByGoal[goalId] || [];
    if (existing.length >= 5) {
      toast.error('Each goal can have at most 5 action steps.');
      return;
    }
    const step = await createGoalStep(goalId, text, existing.length);
    if (step) {
      setStepsByGoal((prev) => ({
        ...prev,
        [goalId]: [...(prev[goalId] || []), step],
      }));
      setNewStepText((prev) => ({ ...prev, [goalId]: '' }));
    } else {
      toast.error('Could not add step.');
    }
  };

  const handleToggleStep = async (stepId: string, goalId: string, completed: boolean) => {
    await updateGoalStep(stepId, { completed: !completed });
    setStepsByGoal((prev) => ({
      ...prev,
      [goalId]: (prev[goalId] || []).map((s) =>
        s.id === stepId ? { ...s, completed: !completed } : s
      ),
    }));
  };

  const handleSaveStepEdit = async (stepId: string, goalId: string) => {
    if (!editingStep) return;
    await updateGoalStep(stepId, { text: editingStep.text.trim() });
    setStepsByGoal((prev) => ({
      ...prev,
      [goalId]: (prev[goalId] || []).map((s) =>
        s.id === stepId ? { ...s, text: editingStep.text.trim() } : s
      ),
    }));
    setEditingStep(null);
  };

  const handleDeleteStep = async (stepId: string, goalId: string) => {
    await deleteGoalStep(stepId);
    setStepsByGoal((prev) => ({
      ...prev,
      [goalId]: (prev[goalId] || []).filter((s) => s.id !== stepId),
    }));
  };

  const getStepProgress = (goalId: string) => {
    const steps = stepsByGoal[goalId] || [];
    const completed = steps.filter((s) => s.completed).length;
    return { completed, total: steps.length };
  };

  if (loading || loadingGoals) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Visionary</span>
          </div>
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="text-sm">
            Dashboard
          </Button>
        </div>

        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">Review your goals</h1>
          <p className="text-muted-foreground text-lg">
            Edit, add, or remove goals. Add action steps to each one, then generate your visual board.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {goals.length === 0 && !adding && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground mb-4">No goals yet. Add your first one to get started.</p>
              <Button onClick={() => setAdding(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add a goal
              </Button>
            </Card>
          )}

          {goals.map((goal) => {
            const progress = getStepProgress(goal.id);
            const isExpanded = expandedSteps.has(goal.id);

            return (
              <Card key={goal.id} className="p-5 animate-fade-in-up">
                {editing?.id === goal.id ? (
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Category</Label>
                        <Select value={editing.category} onValueChange={(v) => setEditing({ ...editing, category: v as GoalCategory })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {GOAL_CATEGORIES.map((c) => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Priority</Label>
                        <Select value={editing.priority} onValueChange={(v) => setEditing({ ...editing, priority: v as GoalPriority })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {GOAL_PRIORITIES.map((p) => (
                              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Title</Label>
                      <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Description</Label>
                      <Textarea value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="min-h-[60px] resize-none" />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => setEditing(null)} className="gap-1">
                        <X className="h-3.5 w-3.5" />
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleEditSave} className="gap-1">
                        <Check className="h-3.5 w-3.5" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: CATEGORY_COLORS[goal.category] }}
                          >
                            {goal.category}
                          </span>
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border"
                            style={{
                              borderColor: GOAL_PRIORITIES.find((p) => p.value === goal.priority)?.color,
                              color: GOAL_PRIORITIES.find((p) => p.value === goal.priority)?.color,
                            }}
                          >
                            {goal.priority}
                          </span>
                        </div>
                        <h3 className="font-semibold text-base mb-1">{goal.title}</h3>
                        {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing({
                          id: goal.id,
                          category: goal.category,
                          title: goal.title,
                          description: goal.description ?? '',
                          priority: goal.priority,
                        })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(goal.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Action Steps Section */}
                    <div className="mt-4 border-t border-border/60 pt-3">
                      <button
                        onClick={() => toggleSteps(goal.id)}
                        className="flex items-center justify-between w-full text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
                      >
                        <span className="flex items-center gap-2">
                          <ListChecks className="h-4 w-4" />
                          Action Steps
                          {progress.total > 0 && (
                            <span className="text-xs tabular-nums">
                              {progress.completed}/{progress.total} complete
                            </span>
                          )}
                        </span>
                        <span className="text-xs">{isExpanded ? 'Hide' : 'Show'}</span>
                      </button>

                      {isExpanded && (
                        <div className="space-y-1.5 animate-fade-in">
                          {(stepsByGoal[goal.id] || []).map((step) => (
                            <div key={step.id} className="flex items-center gap-2 group">
                              <Checkbox
                                checked={step.completed}
                                onCheckedChange={() => handleToggleStep(step.id, goal.id, step.completed)}
                              />
                              {editingStep?.stepId === step.id ? (
                                <div className="flex-1 flex gap-1">
                                  <Input
                                    value={editingStep.text}
                                    onChange={(e) => setEditingStep({ ...editingStep, text: e.target.value })}
                                    className="h-7 text-sm"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveStepEdit(step.id, goal.id);
                                      if (e.key === 'Escape') setEditingStep(null);
                                    }}
                                  />
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveStepEdit(step.id, goal.id)}>
                                    <Check className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingStep(null)}>
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <>
                                  <span
                                    className={`flex-1 text-sm ${step.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                                  >
                                    {step.text}
                                  </span>
                                  <button
                                    onClick={() => setEditingStep({ stepId: step.id, text: step.text })}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStep(step.id, goal.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                                  </button>
                                </>
                              )}
                            </div>
                          ))}

                          {(stepsByGoal[goal.id] || []).length < 5 && (
                            <div className="flex items-center gap-2 pt-1">
                              <Plus className="h-4 w-4 text-muted-foreground" />
                              <Input
                                value={newStepText[goal.id] || ''}
                                onChange={(e) => setNewStepText((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                                placeholder="Add an action step..."
                                className="h-7 text-sm border-none px-0 focus-visible:ring-0"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddStep(goal.id);
                                }}
                              />
                              {newStepText[goal.id]?.trim() && (
                                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => handleAddStep(goal.id)}>
                                  Add
                                </Button>
                              )}
                            </div>
                          )}

                          {(stepsByGoal[goal.id] || []).length === 0 && (
                            <p className="text-xs text-muted-foreground italic pl-6">
                              Add 2-5 concrete steps you will take to achieve this goal.
                            </p>
                          )}
                        </div>
                      )}

                      {progress.total > 0 && (
                        <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(progress.completed / progress.total) * 100}%`,
                              backgroundColor: CATEGORY_COLORS[goal.category],
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {adding && (
            <Card className="p-5 border-dashed-2 border-primary/30 bg-primary/5">
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Category</Label>
                    <Select value={newGoal.category} onValueChange={(v) => setNewGoal({ ...newGoal, category: v as GoalCategory })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GOAL_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Priority</Label>
                    <Select value={newGoal.priority} onValueChange={(v) => setNewGoal({ ...newGoal, priority: v as GoalPriority })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GOAL_PRIORITIES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Title</Label>
                  <Input value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} placeholder="What do you want to achieve?" autoFocus />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Description (optional)</Label>
                  <Textarea value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })} className="min-h-[60px] resize-none" placeholder="Add more details about this goal..." />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => setAdding(false)} className="gap-1">
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleAddSave} className="gap-1">
                    <Check className="h-3.5 w-3.5" />
                    Add goal
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {!adding && goals.length > 0 && (
            <button
              onClick={() => setAdding(true)}
              className="w-full rounded-xl border border-dashed border-border py-4 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add another goal
            </button>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border pt-6">
          <Button variant="ghost" onClick={() => router.push('/dashboard')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <Button onClick={handleGenerateBoard} disabled={generating || goals.length === 0} size="lg" className="gap-2">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate my board
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
