import { collection, deleteDoc, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Decoration, Page, PoemConfig } from '../context/PoemContext';

export interface PoemData {
  id: string;
  title: string;
  pages: Page[];
  activeConfig: PoemConfig;
  stamps: Decoration[];
  washiTapes: Decoration[];
  bookmarks: Decoration[];
  authorUid: string;
  createdAt: number;
  updatedAt: number;
  isPublic?: boolean;
}

export const poemService = {
  // Save or Update a poem
  savePoem: async (userId: string, poem: Omit<PoemData, 'authorUid'>) => {
    try {
      const poemRef = doc(db, 'poems', poem.id);
      const dataToSave = {
        ...poem,
        authorUid: userId,
        updatedAt: Date.now(),
      };
      await setDoc(poemRef, dataToSave, { merge: true });
      return dataToSave;
    } catch (error) {
      console.error('Error saving poem:', error);
      throw error;
    }
  },

  // Fetch all poems for a user
  getUserPoems: async (userId: string) => {
    try {
      const q = query(collection(db, 'poems'), where('authorUid', '==', userId));
      const querySnapshot = await getDocs(q);
      const poems: PoemData[] = [];
      querySnapshot.forEach((doc) => {
        poems.push(doc.data() as PoemData);
      });
      return poems.sort((a, b) => b.updatedAt - a.updatedAt); // Sort by newest
    } catch (error) {
      console.error('Error fetching poems:', error);
      throw error;
    }
  },

  // Delete a poem
  deletePoem: async (poemId: string) => {
    try {
      await deleteDoc(doc(db, 'poems', poemId));
    } catch (error) {
      console.error('Error deleting poem:', error);
      throw error;
    }
  }
};
