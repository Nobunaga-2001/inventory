import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage'; // Import Firebase Storage
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA-C2WNrI1kAVLbmANG7twOOlCjSO9RU3E",
  authDomain: "gyretec-cd7d9.firebaseapp.com",
  databaseURL: "https://gyretec-cd7d9-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "gyretec-cd7d9",
  storageBucket: "gyretec-cd7d9.appspot.com",
  messagingSenderId: "76270426152",
  appId: "1:76270426152:web:a7c425aabf33f1f974bd1d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app); // Get the database instance
const storage = getStorage(app); // Initialize Firebase Storage

export { auth, db, storage }; // Export the storage instance