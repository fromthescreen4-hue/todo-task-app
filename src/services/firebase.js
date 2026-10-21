/**
 * firebase.js — CORE FIT Firebase & Cloud Sync Architecture
 * Handles Google Login, Email/Password authentication, Cloud Firestore sync, and Analytics.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

const CONFIG_STORAGE_KEY = 'corefit_firebase_config';

// Active Firebase Project Configuration via Environment Variables
const DEFAULT_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
};

export function getStoredFirebaseConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.apiKey) return parsed;
    }
  } catch {}
  return DEFAULT_CONFIG;
}

export function saveStoredFirebaseConfig(config) {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('[firebase] Error saving config:', e);
  }
}

let app = null;
let auth = null;
let db = null;
let analytics = null;
let googleProvider = null;

export function isFirebaseConfigured() {
  const cfg = getStoredFirebaseConfig();
  return Boolean(cfg && cfg.apiKey && cfg.projectId && cfg.apiKey.length > 5);
}

export function initFirebase(customConfig = null) {
  const cfg = customConfig || getStoredFirebaseConfig();
  if (customConfig) {
    saveStoredFirebaseConfig(customConfig);
  }

  if (!cfg || !cfg.apiKey || !cfg.projectId || cfg.apiKey.length < 5) {
    return { initialized: false, error: 'Firebase credentials not yet configured' };
  }

  try {
    if (!getApps().length) {
      app = initializeApp(cfg);
    } else {
      app = getApp();
    }
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });

    // Optional Analytics for production client tracking
    if (typeof window !== 'undefined') {
      isAnalyticsSupported().then((supported) => {
        if (supported && app) {
          analytics = getAnalytics(app);
        }
      }).catch(() => {});
    }

    return { initialized: true, auth, db, analytics };
  } catch (err) {
    console.warn('[firebase] Initialization warning:', err.message);
    return { initialized: false, error: err.message };
  }
}

// Auto-initialize with default configuration
if (isFirebaseConfigured()) {
  initFirebase();
}

// ─── Authentication Services ───────────────────────────────────────────────

export async function firebaseRegisterEmail(email, password, displayName) {
  if (!isFirebaseConfigured()) {
    initFirebase();
  }
  if (!auth) throw new Error('Authentication is initializing. Please try again in a moment.');
  
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    try {
      await updateProfile(cred.user, { displayName });
    } catch {}
  }

  const userRecord = {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: displayName || cred.user.displayName || email.split('@')[0],
    provider: 'firebase_email',
    createdAt: new Date().toISOString()
  };

  // Sync baseline doc to Firestore
  try {
    await saveUserToCloud(cred.user.uid, { profile: userRecord });
  } catch (err) {
    console.warn('[firebase] Initial cloud doc sync notice:', err.message);
  }

  return userRecord;
}

export async function firebaseLoginEmail(email, password) {
  if (!isFirebaseConfigured()) {
    initFirebase();
  }
  if (!auth) throw new Error('Authentication is initializing. Please try again in a moment.');

  const cred = await signInWithEmailAndPassword(auth, email, password);
  return {
    uid: cred.user.uid,
    email: cred.user.email,
    displayName: cred.user.displayName || email.split('@')[0],
    provider: 'firebase_email'
  };
}

export async function firebaseLoginGoogle() {
  if (!isFirebaseConfigured()) {
    initFirebase();
  }
  if (!auth || !googleProvider) {
    throw new Error('Google sign-in is initializing. Please try again in a moment.');
  }

  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;
  const userRecord = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || 'Athlete',
    photoURL: user.photoURL || null,
    provider: 'firebase_google'
  };

  try {
    await saveUserToCloud(user.uid, { profile: userRecord });
  } catch {}

  return userRecord;
}

export async function firebaseSendPasswordReset(email) {
  if (!auth) throw new Error('Password reset service unavailable. Please try again later.');
  return sendPasswordResetEmail(auth, email);
}

export async function firebaseLogout() {
  if (auth) {
    try {
      await signOut(auth);
    } catch {}
  }
}

export function subscribeToAuthChanges(callback) {
  if (!auth) return () => {};
  return onAuthStateChanged(auth, callback);
}

// ─── Cloud Firestore Data Sync ─────────────────────────────────────────────

export async function saveUserToCloud(uid, dataPayload) {
  if (!db || !uid) return false;
  try {
    const userDocRef = doc(db, 'users', uid);
    await setDoc(userDocRef, {
      ...dataPayload,
      lastSyncedAt: new Date().toISOString(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('[firebase] Cloud sync write failed:', err);
    throw err;
  }
}

export async function fetchUserFromCloud(uid) {
  if (!db || !uid) return null;
  try {
    const userDocRef = doc(db, 'users', uid);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data();
    }
    return null;
  } catch (err) {
    console.error('[firebase] Cloud sync read failed:', err);
    return null;
  }
}
