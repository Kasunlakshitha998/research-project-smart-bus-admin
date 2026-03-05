import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBl7KgZV4bixC63nB9rh9A4bJmkRsHGz7U",
  authDomain: "smartbus-23f62.firebaseapp.com",
  projectId: "smartbus-23f62",
  storageBucket: "smartbus-23f62.firebasestorage.app",
  messagingSenderId: "926598567220",
  appId: "1:926598567220:web:40d489f8f985abca468161",
  databaseURL: "https://smartbus-23f62-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const realTimeDb = getDatabase(app);
const db = getFirestore(app);

export { realTimeDb, db };
