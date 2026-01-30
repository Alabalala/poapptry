import React, { createContext, ReactNode, useContext, useState } from 'react';

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

export interface Decoration {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
}

export interface Page {
  id: string;
  content: string;
}

interface PoemContextType {
  isEditing: boolean;
  title: string;
  activeConfig: PoemConfig;
  decorations: Decoration[];
  pages: Page[];
  toggleEditMode: () => void;
  setTitle: (title: string) => void;
  updateConfig: (updates: Partial<PoemConfig>) => void;
  setDecorations: (decorations: Decoration[]) => void;
  updatePageContent: (id: string, content: string) => void;
}

const PoemContext = createContext<PoemContextType | undefined>(undefined);

export function PoemProvider({ children }: { children: ReactNode }) {
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
  const [decorations, setDecorations] = useState<Decoration[]>([]);

  const toggleEditMode = () => setIsEditing((prev) => !prev);

  const updateConfig = (updates: Partial<PoemConfig>) => {
    setActiveConfig((prev) => ({ ...prev, ...updates }));
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
        decorations,
        pages,
        toggleEditMode,
        setTitle,
        updateConfig,
        setDecorations,
        updatePageContent,
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
