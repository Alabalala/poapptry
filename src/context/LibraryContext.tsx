import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { PoemData } from '../services/poemService';

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
    const q = query(
      collection(db, 'poems'), 
      where('authorUid', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const poemList: PoemData[] = [];
        snapshot.forEach((doc) => {
          poemList.push(doc.data() as PoemData);
        });
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
