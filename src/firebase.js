import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

// Preserved from the provided Firebase configuration.
const firebaseConfig = {
  apiKey: 'AIzaSyAqGdGTyqWiRR5g2Sk2N671enN5yA4mMD8',
  authDomain: 'helen-fashion.firebaseapp.com',
  projectId: 'helen-fashion',
  storageBucket: 'helen-fashion.firebasestorage.app',
  messagingSenderId: '337549634835',
  appId: '1:337549634835:web:0843e6cbe85547c412fee6',
  measurementId: 'G-V5DRLSK247'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
