// firebaseConfig.js
import { initializeApp, getApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyAIi8GPSMAPJQtnjD1BeFpTweCHAdC9oNE",
  authDomain: "cleaners-choice-3cc65.firebaseapp.com",
  projectId: "cleaners-choice-3cc65",
  storageBucket: "cleaners-choice-3cc65.firebasestorage.app",
  messagingSenderId: "108636811907",
  appId: "1:108636811907:web:db405996aadaef16a621b6",
  measurementId: "G-0LDW9696VZ"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export default app;
