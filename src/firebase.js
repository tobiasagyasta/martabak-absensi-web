// GANTI seluruh nilai di bawah ini dengan config dari project Firebase Anda sendiri.
// Cara ambil: Firebase Console -> Project Settings -> General -> "Your apps" -> SDK setup and configuration
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBlQijI9CKa8ZJD2T6woXPQdRRvmVLIQVg",
  authDomain: "absensi-mp78.firebaseapp.com",
  projectId: "absensi-mp78",
  storageBucket: "absensi-mp78.firebasestorage.app",
  messagingSenderId: "951547628425",
  appId: "1:951547628425:web:91270c06da82f00c2c6f58",
  measurementId: "G-TSTW7LV98V",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
