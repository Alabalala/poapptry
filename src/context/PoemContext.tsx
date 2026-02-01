import { poemService } from '@/services/poemService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
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

// Renamed from Stamp to Decoration to support all types, kept alias for compatibility
export interface Decoration {
  id: string; // Unique instance ID
  assetId: string; // e.g., 'stamp_1', 'washi_gold', 'bookmark_flowers'
  type: 'stamp' | 'washi' | 'bookmark';
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
}
export type Stamp = Decoration; // Alias

// Deprecated but kept for migration logic if needed
export type FixedDecorations = {
  washiId: string | null;
  washiPosition: 'top' | 'bottom';
  bookmarkId: string | null;
  bookmarkSide: 'left' | 'right';
};

export interface TextBox {
  id: string;
  content: string; // HTML or specific format
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  style: {
    fontFamily: string;
    fontSize: number;
    lineHeight?: number;
    textAlign: 'left' | 'center' | 'right';
    color: string;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecorationLine?: 'none' | 'underline' | 'line-through' | 'underline line-through';
  }
}

export interface Page {
  id: string;
  textBoxes: TextBox[];
}

interface PoemContextType {
  poemId: string;
  isEditing: boolean;
  title: string;
  activeConfig: PoemConfig;
  
  // Decorations
  stamps: Decoration[];
  washiTapes: Decoration[];
  bookmarks: Decoration[];
  selectedDecorationId: string | null;
  selectedTextBoxId: string | null;

  pages: Page[];
  toggleEditMode: () => void;
  setEditMode: (editing: boolean) => void;
  setTitle: (title: string) => void;
  updateConfig: (updates: Partial<PoemConfig>) => void;
  
  // Actions
  addStamp: (assetId: string, position?: { x: number; y: number }) => boolean;
  addWashi: (assetId: string, position?: { x: number; y: number }) => boolean;
  addBookmark: (assetId: string, position?: { x: number; y: number }) => boolean;
  addTextBox: (pageId: string, initialContent?: string) => boolean;
  
  updateDecoration: (id: string, updates: Partial<Decoration>) => void;
  removeDecoration: (id: string) => void;
  duplicateTextBox: (pageId: string, textBoxId: string) => void;
  updateTextBox: (pageId: string, textBoxId: string, updates: Partial<TextBox>) => void;
  removeTextBox: (pageId: string, textBoxId: string) => void;
  removeAllDecorations: () => void;
  resetPoem: () => void;
  createNewPoem: () => void;
  loadPoem: (poem: any) => void;
  setSelectedDecorationId: (id: string | null) => void;
  setSelectedTextBoxId: (id: string | null) => void;
  
  // Legacy aliases
  setStamps: (stamps: Stamp[]) => void;
  selectedStampId: string | null;
  setSelectedStampId: (id: string | null) => void;
  updateStamp: (id: string, updates: Partial<Stamp>) => void;
  removeStamp: (id: string) => void;

  // Legacy page content updater (mapped to first textbox or removed?)
  // updatePageContent: (id: string, content: string) => void; 
  
  // Drag and Drop Support
  draggedStamp: { assetId: string; x: number; y: number; type?: 'stamp' | 'washi' | 'bookmark' } | null;
  setDraggedStamp: (stamp: { assetId: string; x: number; y: number; type?: 'stamp' | 'washi' | 'bookmark' } | null) => void;
  paperBounds: { x: number; y: number; width: number; height: number } | null;
  setPaperBounds: (bounds: { x: number; y: number; width: number; height: number } | null) => void;
  getPaperBounds: () => { x: number; y: number; width: number; height: number } | null;
  updateScrollY: (y: number) => void;
  isGuest: boolean;
  setIsGuest: (isGuest: boolean) => void;
}

const PoemContext = createContext<PoemContextType | undefined>(undefined);

export const PoemProvider = ({ children }: { children: ReactNode }) => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(true);
  const [isGuest, setIsGuest] = useState(true);

  useEffect(() => {
    setIsGuest(!user);
  }, [user]);

  const [poemId, setPoemId] = useState<string>(Math.random().toString(36).substr(2, 9));
  const [createdAt, setCreatedAt] = useState<number>(Date.now());
  const [title, setTitle] = useState('Untitled Poem');
  const [pages, setPages] = useState<Page[]>([{ id: '1', textBoxes: [] }]);
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
  
  const [stamps, setStamps] = useState<Decoration[]>([]);
  const [washiTapes, setWashiTapes] = useState<Decoration[]>([]);
  const [bookmarks, setBookmarks] = useState<Decoration[]>([]);
  const [selectedDecorationId, setSelectedDecorationId] = useState<string | null>(null);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  
  // Drag and Drop State
  const [draggedStamp, setDraggedStamp] = useState<{ assetId: string; x: number; y: number; type?: 'stamp' | 'washi' | 'bookmark' } | null>(null);
  const [paperBounds, setPaperBoundsState] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // Scroll Tracking for accurate drop positioning
  const scrollYRef = useRef(0);
  const measuredBoundsRef = useRef<{ bounds: { x: number; y: number; width: number; height: number }; scrollY: number } | null>(null);

  const updateScrollY = (y: number) => {
    scrollYRef.current = y;
  };

  useEffect(() => {
    if (selectedTextBoxId) {
      const page = pages.find(p => p.textBoxes.some(t => t.id === selectedTextBoxId));
      const textBox = page?.textBoxes.find(t => t.id === selectedTextBoxId);
      
      if (textBox) {
        const { style } = textBox;
        setActiveConfig(prev => ({
          ...prev,
          fontId: style.fontFamily || 'Crimson Text',
          fontSize: style.fontSize === 16 ? 'small' : style.fontSize === 22 ? 'large' : 'medium',
          textAlign: style.textAlign || 'left',
          inkColor: style.color || '#000000',
          isBold: style.fontWeight === 'bold',
          isItalic: style.fontStyle === 'italic',
          isUnderline: style.textDecorationLine?.includes('underline') ?? false,
        }));
      }
    }
  }, [selectedTextBoxId, pages]);

  const setPaperBounds = (bounds: { x: number; y: number; width: number; height: number } | null) => {
    if (bounds) {
      measuredBoundsRef.current = {
        bounds,
        scrollY: scrollYRef.current
      };
    }
    setPaperBoundsState(bounds);
  };

  const getPaperBounds = () => {
    if (!measuredBoundsRef.current) return null;
    
    const { bounds, scrollY: measuredScrollY } = measuredBoundsRef.current;
    const currentScrollY = scrollYRef.current;
    
    // Adjust Y position based on scroll difference
    const scrollDiff = currentScrollY - measuredScrollY;
    
    return {
      ...bounds,
      y: bounds.y - scrollDiff
    };
  };

  // Persistence Key
  const STORAGE_KEY = 'poapptry_current_poem';

  // Load data on mount
  useEffect(() => {
    const loadLocalPoem = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (jsonValue != null) {
          const savedPoem = JSON.parse(jsonValue);
          // Restore state
          if (savedPoem.id) setPoemId(savedPoem.id);
          if (savedPoem.createdAt) setCreatedAt(savedPoem.createdAt);
          if (savedPoem.title) setTitle(savedPoem.title);
          if (savedPoem.pages) {
            // Migrate pages to ensure textBoxes exist
            const migratedPages = savedPoem.pages.map((p: any) => {
              if (p.textBoxes) return p;
              
              // If old format with content string, convert to first text box
              if (p.content) {
                return {
                  ...p,
                  textBoxes: [{
                    id: Math.random().toString(36).substr(2, 9),
                    content: p.content,
                    x: 40,
                    y: 40,
                    width: 300,
                    height: 200,
                    rotation: 0,
                    zIndex: 1,
                    style: {
                      fontFamily: savedPoem.activeConfig?.fontId || 'Crimson Text',
                      fontSize: savedPoem.activeConfig?.fontSize === 'small' ? 16 : savedPoem.activeConfig?.fontSize === 'large' ? 22 : 18,
                      textAlign: savedPoem.activeConfig?.textAlign || 'left',
                      color: savedPoem.activeConfig?.inkColor || '#000000',
                    }
                  }]
                };
              }
              
              // If neither, just return empty textBoxes
              return { ...p, textBoxes: [] };
            });
            setPages(migratedPages);
          }
          if (savedPoem.activeConfig) setActiveConfig(savedPoem.activeConfig);
          
          // Migrate old stamps or load new
          if (savedPoem.stamps) {
             // Ensure type property exists if missing
             const loadedStamps = savedPoem.stamps.map((s: any) => ({ ...s, type: s.type || 'stamp' }));
             setStamps(loadedStamps);
          }
          
          // Handle Washi Tapes (Load or Migrate from Fixed)
          if (savedPoem.washiTapes) {
            setWashiTapes(savedPoem.washiTapes);
          } else if (savedPoem.fixedDecorations?.washiId) {
             // Migrate fixed washi to new free-floating system
             const migratedWashi = {
               id: Math.random().toString(36).substr(2, 9),
               assetId: savedPoem.fixedDecorations.washiId,
               type: 'washi' as const,
               x: 50,
               y: savedPoem.fixedDecorations.washiPosition === 'bottom' ? 90 : 5,
               rotation: 0,
               scale: 1,
               opacity: 1
             };
             setWashiTapes([migratedWashi]);
          }

          // Handle Bookmarks (Load or Migrate from Fixed)
          if (savedPoem.bookmarks) {
            setBookmarks(savedPoem.bookmarks);
          } else if (savedPoem.fixedDecorations?.bookmarkId) {
            // Migrate fixed bookmark to new free-floating system
            const migratedBookmark = {
               id: Math.random().toString(36).substr(2, 9),
               assetId: savedPoem.fixedDecorations.bookmarkId,
               type: 'bookmark' as const,
               x: savedPoem.fixedDecorations.bookmarkSide === 'left' ? 5 : 90,
               y: -10,
               rotation: 0,
               scale: 1,
               opacity: 1
            };
            setBookmarks([migratedBookmark]);
          }
        }
      } catch (e) {
        console.error('Failed to load poem data', e);
      }
    };
    loadLocalPoem();
  }, []);

  // Save data on changes (Debounced)
  useEffect(() => {
    const saveData = async () => {
      try {
        const poemData = {
          id: poemId,
          title,
          pages,
          activeConfig,
          stamps,
          washiTapes,
          bookmarks,
          createdAt,
          updatedAt: Date.now(),
        };
        
        // Always save to local storage as "current draft"
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(poemData));

        // If user is logged in, sync to Firestore
        if (user) {
          await poemService.savePoem(user.uid, poemData);
        }
      } catch (e) {
        console.error('Failed to save poem data', e);
      }
    };

    const timeoutId = setTimeout(saveData, 2000); // Save after 2 seconds of inactivity (increased from 1s to reduce writes)


    return () => clearTimeout(timeoutId);
  }, [poemId, createdAt, title, pages, activeConfig, stamps, washiTapes, bookmarks, user]);

  const toggleEditMode = () => setIsEditing((prev) => !prev);
  const setEditMode = (editing: boolean) => setIsEditing(editing);

  const updateConfig = (updates: Partial<PoemConfig>) => {
    setActiveConfig((prev) => ({ ...prev, ...updates }));
  };

  const createDecoration = (assetId: string, type: 'stamp' | 'washi' | 'bookmark', position?: { x: number; y: number }): Decoration => ({
    id: Math.random().toString(36).substr(2, 9),
    assetId,
    type,
    x: position ? position.x : Math.random() * 60 + 20,
    y: position ? position.y : Math.random() * 60 + 20,
    rotation: (Math.random() - 0.5) * 30,
    scale: 1,
    opacity: type === 'stamp' ? 0.8 : 1, // Stamps start slightly transparent
  });

  const addStamp = (assetId: string, position?: { x: number; y: number }) => {
    if (stamps.length >= 3) {
      showToast('You can only place up to 3 stamps per page.', 'info');
      return false;
    }
    const newStamp = createDecoration(assetId, 'stamp', position);
    setStamps((prev) => [...prev, newStamp]);
    setSelectedDecorationId(newStamp.id);
    return true;
  };

  const addWashi = (assetId: string, position?: { x: number; y: number }) => {
    if (washiTapes.length >= 3) {
      showToast('You can only place up to 3 washi tapes per page.', 'info');
      return false;
    }
    const newWashi = createDecoration(assetId, 'washi', position);
    setWashiTapes((prev) => [...prev, newWashi]);
    setSelectedDecorationId(newWashi.id);
    return true;
  };

  const addBookmark = (assetId: string, position?: { x: number; y: number }) => {
    if (bookmarks.length >= 1) {
      showToast('You can only place 1 bookmark per page.', 'info');
      return false;
    }
    const newBookmark = createDecoration(assetId, 'bookmark', position);
    setBookmarks((prev) => [...prev, newBookmark]);
    setSelectedDecorationId(newBookmark.id);
    return true;
  };

  const addTextBox = (pageId: string, initialContent: string = '') => {
    // Generate ID first so we can select it
    const newId = Math.random().toString(36).substr(2, 9);
    
    setPages((prevPages) => {
      return prevPages.map(page => {
        if (page.id !== pageId) return page;

        if (page.textBoxes.length >= 3) {
          showToast('You can only add up to 3 text boxes per page.', 'info');
          return page;
        }

        const newTextBox: TextBox = {
          id: newId,
          content: initialContent,
          x: 10, // 10%
          y: 10, // 10%
          width: 60, // 60%
          height: 8, // Approx 8%
          rotation: 0,
          zIndex: page.textBoxes.length + 1,
          style: {
            fontFamily: activeConfig.fontId,
            fontSize: activeConfig.fontSize === 'small' ? 16 : activeConfig.fontSize === 'medium' ? 18 : 22,
            lineHeight: (activeConfig.fontSize === 'small' ? 16 : activeConfig.fontSize === 'medium' ? 18 : 22) * activeConfig.lineSpacing,
            textAlign: activeConfig.textAlign,
            color: activeConfig.inkColor,
            fontWeight: activeConfig.isBold ? 'bold' : 'normal',
            fontStyle: activeConfig.isItalic ? 'italic' : 'normal',
            textDecorationLine: activeConfig.isUnderline ? 'underline' : 'none',
          }
        };

        return {
          ...page,
          textBoxes: [...page.textBoxes, newTextBox]
        };
      });
    });
    
    // Select the new text box immediately
    setSelectedTextBoxId(newId);
    setSelectedDecorationId(null);
    
    return true;
  };

  const duplicateTextBox = (pageId: string, textBoxId: string) => {
    let newId = Math.random().toString(36).substr(2, 9);
    
    setPages((prevPages) => {
      const page = prevPages.find(p => p.id === pageId);
      if (!page) return prevPages;

      if (page.textBoxes.length >= 3) {
        showToast('You can only add up to 3 text boxes per page.', 'info');
        return prevPages;
      }

      const originalBox = page.textBoxes.find(t => t.id === textBoxId);
      if (!originalBox) return prevPages;

      const newTextBox: TextBox = {
        ...originalBox,
        id: newId,
        x: originalBox.x + 5, // 5% offset
        y: originalBox.y + 5, // 5% offset
        zIndex: page.textBoxes.length + 1,
      };

      return prevPages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          textBoxes: [...p.textBoxes, newTextBox]
        };
      });
    });

    setSelectedTextBoxId(newId);
    setSelectedDecorationId(null);
  };

  const countWords = (str: string) => {
    // Strip HTML tags
    const text = str.replace(/<[^>]*>?/gm, '');
    // Split by whitespace and filter empty strings
    return text.trim().split(/\s+/).filter(w => w.length > 0).length;
  };

  const updateTextBox = (pageId: string, textBoxId: string, updates: Partial<TextBox>) => {
    // Check word count limit
    if (updates.content !== undefined) {
      const currentWordCount = countWords(updates.content);
      if (currentWordCount > 300) {
        showToast('Text box limit is 300 words.', 'warning');
        return; // Block update
      }
    }

    setPages(prev => prev.map(page => {
      if (page.id !== pageId) return page;
      return {
        ...page,
        textBoxes: page.textBoxes.map(box => {
          if (box.id !== textBoxId) return box;
          // Deep merge style to prevent overwriting other style properties (like fontFamily)
          const newStyle = updates.style ? { ...box.style, ...updates.style } : box.style;
          return { ...box, ...updates, style: newStyle };
        })
      };
    }));
  };

  const removeTextBox = (pageId: string, textBoxId: string) => {
    setPages(prev => prev.map(page => {
      if (page.id !== pageId) return page;
      return {
        ...page,
        textBoxes: page.textBoxes.filter(box => box.id !== textBoxId)
      };
    }));
  };

  const updateDecoration = (id: string, updates: Partial<Decoration>) => {
    // Try to update in all lists (only one will match)
    setStamps((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    setWashiTapes((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    setBookmarks((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const removeDecoration = (id: string) => {
    setStamps((prev) => prev.filter((s) => s.id !== id));
    setWashiTapes((prev) => prev.filter((s) => s.id !== id));
    setBookmarks((prev) => prev.filter((s) => s.id !== id));
    if (selectedDecorationId === id) setSelectedDecorationId(null);
  };

  const removeAllDecorations = () => {
    setStamps([]);
    setWashiTapes([]);
    setBookmarks([]);
    setSelectedDecorationId(null);
  };

  const resetPoem = () => {
    const defaultPages = [{ id: '1', textBoxes: [] }];
    const defaultTitle = 'Untitled Poem';
    
    // We keep the ID for reset to avoid creating a new document if it's the same poem
    setTitle(defaultTitle);
    setPages(defaultPages);
    removeAllDecorations();
  };

  const createNewPoem = () => {
    setPoemId(Math.random().toString(36).substr(2, 9));
    setCreatedAt(Date.now());
    setTitle('Untitled Poem');
    setPages([{ id: '1', textBoxes: [] }]);
    setStamps([]);
    setWashiTapes([]);
    setBookmarks([]);
    setSelectedDecorationId(null);
    setIsEditing(true);
  };

  const loadPoem = (poem: any) => {
    if (poem.id) setPoemId(poem.id);
    if (poem.createdAt) setCreatedAt(poem.createdAt);
    if (poem.title) setTitle(poem.title);
    if (poem.pages) setPages(poem.pages);
    if (poem.activeConfig) setActiveConfig(poem.activeConfig);
    if (poem.stamps) setStamps(poem.stamps);
    if (poem.washiTapes) setWashiTapes(poem.washiTapes);
    if (poem.bookmarks) setBookmarks(poem.bookmarks);
    
    setIsEditing(false); // Open in view mode
  };

  // Aliases for backward compatibility
  const updateStamp = updateDecoration;
  const removeStamp = removeDecoration;
  const setSelectedStampId = setSelectedDecorationId;

  return (
    <PoemContext.Provider
      value={{
        poemId,
        isEditing,
        title,
        activeConfig,
        stamps,
        washiTapes,
        bookmarks,
        selectedDecorationId,
        selectedTextBoxId,
        selectedStampId: selectedDecorationId,
        pages,
        toggleEditMode,
        setEditMode,
        setTitle,
        updateConfig,
        setStamps, // Legacy
        setSelectedDecorationId,
        setSelectedTextBoxId,
        setSelectedStampId,
        addStamp,
        addWashi,
        addBookmark,
        addTextBox,
        updateDecoration,
        updateStamp,
        duplicateTextBox,
        updateTextBox,
        removeDecoration,
        removeTextBox,
        removeAllDecorations,
        resetPoem,
        createNewPoem,
        loadPoem,
        removeStamp,
        draggedStamp,
        setDraggedStamp,
        paperBounds,
        setPaperBounds,
        getPaperBounds,
        updateScrollY,
        isGuest,
        setIsGuest,
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
