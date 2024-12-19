// firebaseConfig.js
import { initializeApp  } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyA4n5nCy7Dusm20E0oH3tSgOH12G-0kjHU",
  authDomain: "facultygaurd.firebaseapp.com",
  projectId: "facultygaurd",
  storageBucket: "facultygaurd.appspot.com",
  messagingSenderId: "289777686411",
  appId: "1:289777686411:android:7e4ea616ff3a252a0b018e",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore and Storage
const firestore = getFirestore(app);
const storage = getStorage(app);

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Export each Firebase service individually
export { firestore, storage, auth };
