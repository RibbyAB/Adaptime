import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAzdCIG87SnK8SbN2GoGAVsqZER_Eai0B0",
  authDomain: "adaptime-df1f2.firebaseapp.com",
  projectId: "adaptime-df1f2",
  storageBucket: "adaptime-df1f2.firebasestorage.app",
  messagingSenderId: "718151825943",
  appId: "1:718151825943:web:0e326832843b71eac77a52"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
