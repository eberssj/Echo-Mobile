import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBpfgjn122BX-KcO1LiRVzaZqmte1RGF58",
  authDomain: "echo-8dbe4.firebaseapp.com",
  projectId: "echo-8dbe4",
  storageBucket: "echo-8dbe4.firebasestorage.app",
  messagingSenderId: "366717797315",
  appId: "1:366717797315:web:cd0cad58dd045caef07376",
  measurementId: "G-6ES73RF9DX",
};

const app = initializeApp(firebaseConfig);

// Inicializar Auth com persistência
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Inicializar Firestore
export const db = getFirestore(app);

// Inicializar Analytics apenas se suportado
export let analytics = null;
isSupported().then((supported) => {
  if (supported) {
    analytics = getAnalytics(app);
  }
});