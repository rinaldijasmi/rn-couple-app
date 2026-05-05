// Konfigurasi Firebase untuk Wedding Planner Rinaldi & Naura Syifa
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBaQxPPUXam-CsbILwcz3eZhvmUefQXMQI",
  authDomain: "wedding-rinaldi-naura.firebaseapp.com",
  projectId: "wedding-rinaldi-naura",
  storageBucket: "wedding-rinaldi-naura.firebasestorage.app",
  messagingSenderId: "430196630739",
  appId: "1:430196630739:web:9bd32d1e99dd7569db6026"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
