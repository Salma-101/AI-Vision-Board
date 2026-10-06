'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Plus, ArrowRight, Loader2, LayoutGrid, Trash2, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getBoards, getGoals, createBoard, deleteBoard } from '@/lib/db';
import { Board, Goal } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface BoardWithGoals extends Board {
  goals?: Goal[];
  goalCount?: number;
  completedCount?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [boards, setBoards] = useState<BoardWithGoals[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadBoards();
    }
  }, [user]);

  const loadBoards = async () => {
    setLoadingBoards(true);
    const data = await getBoards();
    const boardsWithGoals = await Promise.all(
      data.map(async (board) => {
        const goals = await getGoals(board.id);
        return {
          ...board,
          goals,
          goalCount: goals.length,
          completedCount: goals.filter((g) => g.completed).length,
        };
      })
    );
    setBoards(boardsWithGoals);
    setLoadingBoards(false);
  };

  const handleCreateBoard = async () => {
    setCreating(true);
    const board = await createBoard('Untitled Vision Board');
    if (board) {
      router.push(`/onboarding?board=${board.id}`);
    } else {
      toast.error('Could not create a board. Please try again.');
    }
    setCreating(false);
  };

  const handleDeleteBoard = async (id: string) => {
    const success = await deleteBoard(id);
    if (success) {
      toast.success('Board deleted');
      loadBoards();
    } else {
      toast.error('Could not delete board.');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading || loadingBoards) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Visionary</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="text-sm text-muted-foreground"
          >
            Home
          </Button>
        </div>

        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
              Your vision boards
            </h1>
            <p className="text-muted-foreground">
              {boards.length === 0
                ? 'Create your first board to start visualizing your goals.'
                : `${boards.length} ${boards.length === 1 ? 'board' : 'boards'}`}
            </p>
          </div>
          <Button onClick={handleCreateBoard} disabled={creating} className="gap-2">
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            New board
          </Button>
        </div>

        {boards.length === 0 ? (
          <Card className="p-16 text-center border-dashed">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary mx-auto mb-6">
              <LayoutGrid className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No boards yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Start by creating a new board. Describe your goals and we&apos;ll turn them into a visual vision.
            </p>
            <Button onClick={handleCreateBoard} disabled={creating} className="gap-2">
              <Plus className="h-4 w-4" />
              Create your first board
            </Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {boards.map((board) => {
              const progress = board.goalCount && board.goalCount > 0
                ? Math.round((board.completedCount! / board.goalCount) * 100)
                : 0;
              return (
                <div
                  key={board.id}
                  className="group cursor-pointer animate-fade-in-up"
                  onClick={() => router.push(`/board/${board.id}`)}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 h-full">
                    <div
                      className="h-40 relative"
                      style={{ backgroundColor: board.background_color || '#fafaf9' }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-foreground/10" />
                      <div className="absolute top-4 right-4">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this board?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete &quot;{board.title}&quot; and all its goals and elements. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBoard(board.id);
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-base mb-1 truncate">{board.title}</h3>
                      {board.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{board.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(board.created_at)}
                        </span>
                        <span>{board.goalCount} {board.goalCount === 1 ? 'goal' : 'goals'}</span>
                      </div>
                      {board.goalCount && board.goalCount > 0 ? (
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{progress}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-foreground transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <ArrowRight className="h-3.5 w-3.5" />
                          Start building
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
