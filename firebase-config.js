// ═══════════════════════════════════════════════════════════
// FIREBASE YAPILANDIRMA - bcka-site
// Mevcut Firebase projesi kullanılıyor
// ═══════════════════════════════════════════════════════════

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  addDoc,
  getDoc, 
  getDocs,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// ⚠️ DOĞRU API KEY (yenikayit projesinden)
const firebaseConfig = {
  apiKey: "AIzaSyARlqAoh-HRBC9xPwj7qRgG-IuZFSH39Uc",
  authDomain: "bcka-site.firebaseapp.com",
  projectId: "bcka-site",
  storageBucket: "bcka-site.firebasestorage.app",
  messagingSenderId: "1063268088787",
  appId: "1:1063268088787:web:e03c7d1ff9fd3d8bd3a3d4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Apps Script proxy URL - güvenli mail ve AI analiz
const PROXY_URL = "https://script.google.com/macros/s/AKfycbynjWb-QLdWb0xlTY-ySPciNxnjUDGHzPEopQc-1vzFu8eQucdTESbEQUG3X6CNZn1U/exec";

// Sabitler
const ADMIN_EPOSTA = "emrahby@gmail.com";

export { 
  auth, 
  db, 
  googleProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  PROXY_URL,
  ADMIN_EPOSTA
};
