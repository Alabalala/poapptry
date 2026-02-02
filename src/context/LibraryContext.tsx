import { collection, onSnapshot, query, where } from 'firebase/firestore';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { PoemData } from '../services/poemService';
import { useAuth } from './AuthContext';

interface LibraryContextType {
  poems: PoemData[];
  loading: boolean;
  error: string | null;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [poems, setPoems] = useState<PoemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setPoems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Remove orderBy to avoid requiring a composite index immediately
    // We can sort client-side since the number of poems per user is likely small
    const q = query(
      collection(db, 'poems'), 
      where('authorUid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const poemList: PoemData[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as PoemData;
          // Ensure ID is present (fallback to doc.id if missing in data)
          if (!data.id) {
            data.id = doc.id;
          }
          // Ensure critical fields exist to prevent crashes in UI
          if (!data.pages) data.pages = [{ id: '1', textBoxes: [] }];
          if (!data.activeConfig) {
             data.activeConfig = {
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
             };
          }
          poemList.push(data);
        });
        
        // Sort client-side
        poemList.sort((a, b) => b.updatedAt - a.updatedAt);
        
        setPoems(poemList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error listening to poems:', err);
        setError('Failed to load poems');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return (
    <LibraryContext.Provider value={{ poems, loading, error }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (context === undefined) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return context;
};
