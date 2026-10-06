'use client';

import {
  Undo2,
  Redo2,
  Trash2,
  Copy,
  BringToFront,
  SendToBack,
  ZoomIn,
  ZoomOut,
  Type,
  Image as ImageIcon,
  Save,
  ArrowLeft,
  Maximize,
  Sparkles,
} from 'lucide-react';
import { useEditorStore } from '@/lib/editor-store';
import { BoardElement } from '@/lib/types';
import { toast } from 'sonner';

interface EditorToolbarProps {
  boardTitle: string;
  onBack: () => void;
  onSave: () => void;
  onAddText: () => void;
  onAddImage: (src: string) => void;
  saving: boolean;
}

const STOCK_IMAGES = [
  'https://images.pexels.com/photos/36252681/pexels-photo-36252681.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/1714456/pexels-photo-1714456.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/2889618/pexels-photo-2889618.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/6789634/pexels-photo-6789634.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/20540999/pexels-photo-20540999.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/1616105/pexels-photo-1616105.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/38094569/pexels-photo-38094569.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/13291016/pexels-photo-13291016.jpeg?auto=compress&cs=tinysrgb&w=600',
];

export default function EditorToolbar({
  boardTitle,
  onBack,
  onSave,
  onAddText,
  onAddImage,
  saving,
}: EditorToolbarProps) {
  const {
    selectedIds,
    deleteElement,
    duplicateElement,
    bringToFront,
    sendToBack,
    undo,
    redo,
    canUndo,
    canRedo,
    zoom,
    setZoom,
    panX,
    panY,
    setPan,
  } = useEditorStore();

  const hasSelection = selectedIds.length > 0;

  const handleDuplicate = () => {
    if (selectedIds.length > 0) {
      duplicateElement(selectedIds[0]);
      toast.success('Duplicated');
    }
  };

  const handleDelete = () => {
    selectedIds.forEach((id) => deleteElement(id));
    toast.success('Deleted');
  };

  return (
    <>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-medium truncate max-w-[200px]">{boardTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground w-12 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setZoom(1); setPan(0, 0); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            title="Reset view"
          >
            <Maximize className="h-4 w-4" />
          </button>

          <div className="w-px h-6 bg-border mx-1" />

          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Left toolbar - add elements */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 rounded-xl bg-background/80 backdrop-blur-md border border-border p-1.5 shadow-lg">
        <button
          onClick={onAddText}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent transition-colors"
          title="Add text"
        >
          <Type className="h-4 w-4" />
        </button>
        <ImagePickerButton onPick={onAddImage} />
      </div>

      {/* Right context toolbar - element actions */}
      {hasSelection && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1 rounded-xl bg-background/80 backdrop-blur-md border border-border p-1.5 shadow-lg animate-scale-in">
          <button
            onClick={handleDuplicate}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            title="Duplicate"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={() => bringToFront(selectedIds[0])}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            title="Bring to front"
          >
            <BringToFront className="h-4 w-4" />
          </button>
          <button
            onClick={() => sendToBack(selectedIds[0])}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent transition-colors"
            title="Send to back"
          >
            <SendToBack className="h-4 w-4" />
          </button>
          <div className="h-px bg-border my-1" />
          <button
            onClick={handleDelete}
            className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}

function ImagePickerButton({ onPick }: { onPick: (src: string) => void }) {
  return (
    <div className="relative group">
      <button className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent transition-colors">
        <ImageIcon className="h-4 w-4" />
      </button>
      <div className="absolute left-full ml-2 top-0 hidden group-hover:block z-30">
        <div className="rounded-xl bg-background border border-border shadow-xl p-3 w-64">
          <p className="text-xs font-medium text-muted-foreground mb-3 px-1">Stock images</p>
          <div className="grid grid-cols-3 gap-2">
            {STOCK_IMAGES.map((src) => (
              <button
                key={src}
                onClick={() => onPick(src)}
                className="aspect-square rounded-lg overflow-hidden border border-border hover:border-foreground transition-colors"
              >
                <img src={src} alt="Stock" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
