import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace this with your own config object
// 1. Go to Firebase Console -> Project settings
// 2. Add an app -> Select Web (the </> icon)
// 3. Register app and copy the firebaseConfig object below
const firebaseConfig = {
  apiKey: "AIzaSyBH0fG8PJ8nULnXDgVwqyu_S16zqZkNR14",
  authDomain: "directkisan-23c11.firebaseapp.com",
  projectId: "directkisan-23c11",
  storageBucket: "directkisan-23c11.firebasestorage.app",
  messagingSenderId: "627076767676",
  appId: "1:627076767676:web:1ad43171e0062ed8fa55b9",
  measurementId: "G-DC3M43ZSPN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
