// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyC_wEAzTPA9CO0M-pT84H3uteW7kTaERb0",
  authDomain: "test-7f316.firebaseapp.com",
  projectId: "test-7f316",
  storageBucket: "test-7f316.appspot.com",
  messagingSenderId: "158326026589",
  appId: "1:158326026589:web:ba9065b007eb8aa09bf8b4",
  measurementId: "G-LXKPBVXZN1"
};


export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

