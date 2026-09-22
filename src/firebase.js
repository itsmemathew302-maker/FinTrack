import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1WJRxV552pYoIVMNmBYxv1G4c5hYmBII",
  authDomain: "fintrack-d476b.firebaseapp.com",
  projectId: "fintrack-d476b",
  storageBucket: "fintrack-d476b.firebasestorage.app",
  messagingSenderId: "47786636331",
  appId: "1:47786636331:web:65640affb83a8f4a5ee66e",
  measurementId: "G-J6RYF11T6C",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
