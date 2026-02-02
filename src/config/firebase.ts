import AsyncStorage from '@react-native-async-storage/async-storage';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { Auth, getAuth, GoogleAuthProvider, initializeAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Check if we are in a static build environment (Node.js) and missing keys
// This prevents the build from crashing during static rendering
if (typeof window === 'undefined' && !firebaseConfig.apiKey) {
  console.warn("Detected missing Firebase keys in static build. Using mock values to prevent build crash.");
  firebaseConfig.apiKey = "dummy-api-key-for-build";
  firebaseConfig.authDomain = "dummy.firebaseapp.com";
  firebaseConfig.projectId = "dummy-project";
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Fallback for build safety
    if (typeof window === 'undefined') {
       app = getApps()[0]; // Should be undefined but let's see
    }
    throw error;
  }

  
  if (Platform.OS === 'web') {
    // On web, getAuth() uses browserLocalPersistence by default.
    // Using initializeAuth() without persistence args (as before) would default to inMemoryPersistence in some versions.
    auth = getAuth(app);
  } else {
    // Extract getReactNativePersistence safely
    const { getReactNativePersistence } = FirebaseAuth as any;
    
    if (getReactNativePersistence) {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
    } else {
      auth = initializeAuth(app);
    }
  }
  
  db = getFirestore(app);
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };

