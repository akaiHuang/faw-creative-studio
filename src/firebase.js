// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; // Authentication
import { getFirestore } from "firebase/firestore"; // Firestore
import { getDatabase } from "firebase/database"; // Realtime Database

// Configuration from your .env file
const firebaseConfig = {
  apiKey: "AIzaSyCAtu8Hp-SUSCmEiFptfYBuhqMzSPQV-Jk",
  authDomain: "fawstudio-31d9a.firebaseapp.com",
  databaseURL: "https://fawstudio-31d9a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fawstudio-31d9a",
  storageBucket: "fawstudio-31d9a.firebasestorage.app",
  messagingSenderId: "65346193390",
  appId: "1:65346193390:web:fbf7774f82de7b3561b0ff",
  measurementId: "G-R231LL2XB7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app); // Database 1 (Firestore)
export const rtdb = getDatabase(app); // Database 2 (Realtime)

export default app;
