// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBY1b3ZQxfbQk-aQQXon3RxebfvXBy2-Vc",
  authDomain: "matchpage.firebaseapp.com",
  projectId: "matchpage",
  storageBucket: "matchpage.firebasestorage.app",
  messagingSenderId: "784261462479",
  appId: "1:784261462479:web:3e39c34264d5c377237aba"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);


