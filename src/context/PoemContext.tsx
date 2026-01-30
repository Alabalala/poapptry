import React, { createContext, ReactNode, useContext, useState } from 'react';

export type PoemConfig = {
  presetId: string;
  paperId: string;
  fontId: string;
  inkColor: string;
};

export interface Decoration {
  id: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
}

interface PoemContextType {
  isEditing: boolean;
  activeConfig: PoemConfig;
  decorations: Decoration[];
  toggleEditMode: () => void;
  updateConfig: (updates: Partial<PoemConfig>) => void;
  setDecorations: (decorations: Decoration[]) => void;
}

const PoemContext = createContext<PoemContextType | undefined>(undefined);

export function PoemProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(true);
  const [activeConfig, setActiveConfig] = useState<PoemConfig>({
    presetId: 'classic',
    paperId: 'paper_classic',
    fontId: 'Crimson Text',
    inkColor: '#000000',
  });
  const [decorations, setDecorations] = useState<Decoration[]>([]);

  const toggleEditMode = () => setIsEditing((prev) => !prev);

  const updateConfig = (updates: Partial<PoemConfig>) => {
    setActiveConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <PoemContext.Provider
      value={{
        isEditing,
        activeConfig,
        decorations,
        toggleEditMode,
        updateConfig,
        setDecorations,
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
