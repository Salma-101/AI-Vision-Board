'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { getBoard, getGoals, getBoardElements, saveBoardElements, updateBoard, createGeneratedAsset, createGenerationJob, updateGenerationJob } from '@/lib/db';
import { generateBoardLayout, generateVisualConcepts } from '@/lib/ai-service';
import { Board, Goal, BoardElement, CATEGORY_COLORS } from '@/lib/types';
import { useEditorStore } from '@/lib/editor-store';
import BoardCanvas from '@/components/editor/board-canvas';
import EditorToolbar from '@/components/editor/editor-toolbar';
import { toast } from 'sonner';

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
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 1200, height: 800 });

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
      setBackgroundColor(boardData.background_color || '#fafaf9');
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

  const handleGenerate = async () => {
    if (goals.length === 0) {
      toast.error('No goals to generate visuals for.');
      return;
    }
    setGenerating(true);

    try {
      const job = await createGenerationJob(boardId, goals.length);

      const layout = await generateBoardLayout(
        goals.map((g) => ({
          id: g.id,
          category: g.category,
          title: g.title,
          visual_prompt: g.visual_prompt,
        }))
      );

      const concepts = await generateVisualConcepts(
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

        const categoryImages = STOCK_IMAGES_BY_CATEGORY[goal.category] || STOCK_IMAGES_BY_CATEGORY.other;
        const imageUrl = categoryImages[i % categoryImages.length];

        const asset = await createGeneratedAsset({
          goal_id: goal.id,
          prompt: concepts.concepts[i]?.prompt || goal.visual_prompt || '',
          model: 'mock',
          storage_url: imageUrl,
          category: goal.category,
        });

        const maxZ = Math.max(...newElements.map((e) => e.z_index), 0);

        newElements.push({
          id: crypto.randomUUID(),
          board_id: boardId,
          user_id: user!.id,
          type: 'image',
          asset_id: asset?.id ?? null,
          x: layoutItem.x,
          y: layoutItem.y,
          width: layoutItem.width,
          height: layoutItem.height,
          rotation: 0,
          z_index: maxZ + 1,
          properties: {
            src: imageUrl,
            cornerRadius: 16,
            shadowColor: 'black',
            shadowBlur: 20,
            shadowOpacity: 0.15,
            shadowOffsetY: 6,
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        const cardWidth = 200;
        const cardHeight = 80;
        newElements.push({
          id: crypto.randomUUID(),
          board_id: boardId,
          user_id: user!.id,
          type: 'goal_card',
          asset_id: null,
          x: layoutItem.x,
          y: layoutItem.y + layoutItem.height + 12,
          width: cardWidth,
          height: cardHeight,
          rotation: 0,
          z_index: maxZ + 2,
          properties: {
            goalId: goal.id,
            goalTitle: goal.title,
            goalCategory: goal.category,
            goalPriority: goal.priority,
            backgroundColor: '#ffffff',
            borderColor: CATEGORY_COLORS[goal.category],
            padding: 12,
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
      toast.error('Generation failed. Please try again.');
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
      rotation: 0,
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
      rotation: 0,
      z_index: maxZ + 1,
      properties: {
        src,
        cornerRadius: 12,
        shadowColor: 'black',
        shadowBlur: 16,
        shadowOpacity: 0.12,
        shadowOffsetY: 4,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    toast.success('Image added');
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      <EditorToolbar
        boardTitle={board?.title ?? 'Vision Board'}
        onBack={() => router.push('/dashboard')}
        onSave={handleSave}
        onAddText={handleAddText}
        onAddImage={handleAddImage}
        saving={saving}
      />

      <div ref={containerRef} className="absolute inset-0">
        <BoardCanvas width={containerSize.width} height={containerSize.height} />
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
    </div>
  );
}
