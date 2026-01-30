import React, { createContext, ReactNode, useContext, useState } from 'react';
import { useToast } from './ToastContext';

export type PoemConfig = {
  presetId: string;
  paperId: string;
  fontId: string;
  inkColor: string;
  fontSize: 'small' | 'medium' | 'large';
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'center' | 'bottom';
  lineSpacing: number; // multiplier
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
};

export interface Stamp {
  id: string; // Unique instance ID
  assetId: string; // e.g., 'stamp_1'
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
}

export type FixedDecorations = {
  washiId: string | null;
  washiPosition: 'top' | 'bottom';
  bookmarkId: string | null;
  bookmarkSide: 'left' | 'right';
};

export interface Page {
  id: string;
  content: string;
}

interface PoemContextType {
  isEditing: boolean;
  title: string;
  activeConfig: PoemConfig;
  fixedDecorations: FixedDecorations;
  stamps: Stamp[];
  selectedStampId: string | null;
  pages: Page[];
  toggleEditMode: () => void;
  setTitle: (title: string) => void;
  updateConfig: (updates: Partial<PoemConfig>) => void;
  updateFixedDecorations: (updates: Partial<FixedDecorations>) => void;
  setStamps: (stamps: Stamp[]) => void;
  setSelectedStampId: (id: string | null) => void;
  addStamp: (assetId: string, position?: { x: number; y: number }) => boolean;
  updateStamp: (id: string, updates: Partial<Stamp>) => void;
  removeStamp: (id: string) => void;
  updatePageContent: (id: string, content: string) => void;
  
  // Drag and Drop Support
  draggedStamp: { assetId: string; x: number; y: number } | null;
  setDraggedStamp: (stamp: { assetId: string; x: number; y: number } | null) => void;
  paperBounds: { x: number; y: number; width: number; height: number } | null;
  setPaperBounds: (bounds: { x: number; y: number; width: number; height: number } | null) => void;
}

const PoemContext = createContext<PoemContextType | undefined>(undefined);

export const PoemProvider = ({ children }: { children: ReactNode }) => {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(true);
  const [title, setTitle] = useState('Untitled Poem');
  const [pages, setPages] = useState<Page[]>([{ id: '1', content: '' }]);
  const [activeConfig, setActiveConfig] = useState<PoemConfig>({
    presetId: 'classic',
    paperId: 'paper_classic',
    fontId: 'Crimson Text',
    inkColor: '#000000',
    fontSize: 'medium',
    textAlign: 'left',
    verticalAlign: 'top',
    lineSpacing: 1.5,
    isBold: false,
    isItalic: false,
    isUnderline: false,
  });
  const [fixedDecorations, setFixedDecorations] = useState<FixedDecorations>({
    washiId: null,
    washiPosition: 'top',
    bookmarkId: null,
    bookmarkSide: 'right',
  });
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);
  
  // Drag and Drop State
  const [draggedStamp, setDraggedStamp] = useState<{ assetId: string; x: number; y: number } | null>(null);
  const [paperBounds, setPaperBounds] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const toggleEditMode = () => setIsEditing((prev) => !prev);

  const updateConfig = (updates: Partial<PoemConfig>) => {
    setActiveConfig((prev) => ({ ...prev, ...updates }));
  };

  const updateFixedDecorations = (updates: Partial<FixedDecorations>) => {
    setFixedDecorations((prev) => ({ ...prev, ...updates }));
  };

  const addStamp = (assetId: string, position?: { x: number; y: number }) => {
    if (stamps.length >= 3) {
      showToast('You can only place up to 3 stamps per page.', 'info');
      return false;
    }

    const newId = Math.random().toString(36).substr(2, 9);
    const newStamp: Stamp = {
      id: newId,
      assetId,
      x: position ? position.x : Math.random() * 60 + 20, // Random position 20-80% if not provided
      y: position ? position.y : Math.random() * 60 + 20,
      rotation: (Math.random() - 0.5) * 30,
      scale: 1,
      opacity: 0.8,
    };
    setStamps((prev) => [...prev, newStamp]);
    setSelectedStampId(newId);
    return true;
  };

  const updateStamp = (id: string, updates: Partial<Stamp>) => {
    setStamps((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeStamp = (id: string) => {
    setStamps((prev) => prev.filter((s) => s.id !== id));
  };

  const updatePageContent = (id: string, content: string) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, content } : p)));
  };

  return (
    <PoemContext.Provider
      value={{
        isEditing,
        title,
        activeConfig,
        fixedDecorations,
        stamps,
        selectedStampId,
        pages,
        toggleEditMode,
        setTitle,
        updateConfig,
        updateFixedDecorations,
        setStamps,
        setSelectedStampId,
        addStamp,
        updateStamp,
        removeStamp,
        updatePageContent,
        draggedStamp,
        setDraggedStamp,
        paperBounds,
        setPaperBounds,
      }}
    >
      {children}
    </PoemContext.Provider>
  );
}

export function usePoem() {
  const context = useContext(PoemContext);
  if (context === undefined) {
    throw new Error('usePoem must be used within a PoemProvider');
  }
  return context;
}
