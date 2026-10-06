'use client';

import { create } from 'zustand';
import { BoardElement, ElementType, BoardElementProperties } from './types';

interface EditorState {
  elements: BoardElement[];
  selectedIds: string[];
  history: BoardElement[][];
  historyIndex: number;
  zoom: number;
  panX: number;
  panY: number;
  backgroundColor: string;

  setElements: (elements: BoardElement[]) => void;
  addElement: (element: BoardElement) => void;
  updateElement: (id: string, updates: Partial<BoardElement>) => void;
  updateElementProperties: (id: string, props: Partial<BoardElementProperties>) => void;
  deleteElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;

  selectElement: (id: string | null) => void;
  selectMultiple: (ids: string[]) => void;
  clearSelection: () => void;

  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setBackgroundColor: (color: string) => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  commitHistory: () => void;
  resetHistory: () => void;

  loadFromDB: (elements: BoardElement[]) => void;
}

function pushHistory(state: EditorState): Partial<EditorState> {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push([...state.elements]);
  const trimmed = newHistory.slice(-50);
  return {
    history: trimmed,
    historyIndex: trimmed.length - 1,
  };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  elements: [],
  selectedIds: [],
  history: [[]],
  historyIndex: 0,
  zoom: 1,
  panX: 0,
  panY: 0,
  backgroundColor: '#fafaf9',

  setElements: (elements) => set({ elements }),

  addElement: (element) => {
    const state = get();
    set({
      ...pushHistory(state),
      elements: [...state.elements, element],
      selectedIds: [element.id],
    });
  },

  updateElement: (id, updates) => {
    const state = get();
    set({
      elements: state.elements.map((el) =>
        el.id === id ? { ...el, ...updates } : el
      ),
    });
  },

  updateElementProperties: (id, props) => {
    const state = get();
    set({
      elements: state.elements.map((el) =>
        el.id === id
          ? { ...el, properties: { ...el.properties, ...props } }
          : el
      ),
    });
  },

  deleteElement: (id) => {
    const state = get();
    set({
      ...pushHistory(state),
      elements: state.elements.filter((el) => el.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    });
  },

  duplicateElement: (id) => {
    const state = get();
    const original = state.elements.find((el) => el.id === id);
    if (!original) return;
    const newId = crypto.randomUUID();
    const maxZ = Math.max(...state.elements.map((e) => e.z_index), 0);
    const duplicate: BoardElement = {
      ...original,
      id: newId,
      x: original.x + 30,
      y: original.y + 30,
      z_index: maxZ + 1,
      properties: { ...original.properties },
    };
    set({
      ...pushHistory(state),
      elements: [...state.elements, duplicate],
      selectedIds: [newId],
    });
  },

  bringForward: (id) => {
    const state = get();
    const el = state.elements.find((e) => e.id === id);
    if (!el) return;
    set({
      elements: state.elements.map((e) =>
        e.id === id ? { ...e, z_index: e.z_index + 1 } : e
      ),
    });
  },

  sendBackward: (id) => {
    const state = get();
    set({
      elements: state.elements.map((e) =>
        e.id === id ? { ...e, z_index: Math.max(0, e.z_index - 1) } : e
      ),
    });
  },

  bringToFront: (id) => {
    const state = get();
    const maxZ = Math.max(...state.elements.map((e) => e.z_index), 0);
    set({
      elements: state.elements.map((e) =>
        e.id === id ? { ...e, z_index: maxZ + 1 } : e
      ),
    });
  },

  sendToBack: (id) => {
    const state = get();
    const minZ = Math.min(...state.elements.map((e) => e.z_index), 0);
    set({
      elements: state.elements.map((e) =>
        e.id === id ? { ...e, z_index: minZ - 1 } : e
      ),
    });
  },

  selectElement: (id) => set({ selectedIds: id ? [id] : [] }),
  selectMultiple: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),

  setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(3, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  setBackgroundColor: (color) => {
    const state = get();
    set({ ...pushHistory(state), backgroundColor: color });
  },

  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const prev = state.history[state.historyIndex - 1];
      set({
        elements: [...prev],
        historyIndex: state.historyIndex - 1,
        selectedIds: [],
      });
    }
  },

  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const next = state.history[state.historyIndex + 1];
      set({
        elements: [...next],
        historyIndex: state.historyIndex + 1,
        selectedIds: [],
      });
    }
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  commitHistory: () => {
    const state = get();
    set(pushHistory(state));
  },

  resetHistory: () => set({ history: [[]], historyIndex: 0 }),

  loadFromDB: (elements) => {
    set({
      elements,
      selectedIds: [],
      history: [[...elements]],
      historyIndex: 0,
    });
  },
}));
