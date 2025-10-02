import { db, storage } from "./firebase-config.js";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const fileInput  = document.getElementById("fileInput");
const submitBtn  = document.getElementById("submitBtn");
const resultDiv  = document.getElementById("result");
const matchInfo  = document.getElementById("matchInfo");
const myPhoto    = document.getElementById("myPhoto");

const userId = "u_" + Math.random().toString(36).substring(2, 10);

const qaPairs = [
  { q: "¿Cuál es el planeta más cercano al Sol?", a: "Mercurio" },
  { q: "¿En qué continente está Egipto?", a: "África" },
  { q: "¿Cuántos lados tiene un hexágono?", a: "6" },
  { q: "¿Quién pintó la Mona Lisa?", a: "Leonardo da Vinci" },
  { q: "¿Cuál es el océano más grande del mundo?", a: "Océano Pacífico" },
  { q: "¿Qué gas respiramos principalmente?", a: "Oxígeno" },
  { q: "¿En qué año llegó el ser humano a la Luna?", a: "1969" },
  { q: "¿Cuál es el país con más habitantes?", a: "China" },
  { q: "¿Qué instrumento tiene teclas blancas y negras?", a: "Piano" },
  { q: "¿Qué animal es conocido como el rey de la selva?", a: "León" }
];

function showResult(msg) {
  matchInfo.textContent = msg;
  resultDiv.style.display = "block";
}

submitBtn.addEventListener("click", async () => {
  submitBtn.disabled = true;

  try {
    console.log("👉 Iniciando registro de usuario:", userId);

    // Subir foto si hay
    let photoURL = null;
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const storageRef = ref(storage, `photos/${userId}_${Date.now()}_${file.name}`);
      console.log("📤 Subiendo foto a storage...");
      await uploadBytes(storageRef, file);
      photoURL = await getDownloadURL(storageRef);
      myPhoto.src = photoURL;
      console.log("✅ Foto subida:", photoURL);
    }

    const waitingRef = doc(db, "waiting", "qa");
    const waitingSnap = await getDoc(waitingRef);

    if (!waitingSnap.exists()) {
      // No hay nadie esperando → asigno pregunta
      const questionIndex = Math.floor(Math.random() * qaPairs.length);
      console.log("📝 Nadie esperando. Me asignan la PREGUNTA:", qaPairs[questionIndex].q);

      await setDoc(doc(db, "users", userId), {
        uid: userId,
        role: "question",
        questionIndex,
        question: qaPairs[questionIndex].q,
        answer: qaPairs[questionIndex].a,
        photoURL,
        matchWith: null,
        createdAt: Date.now()
      });
      console.log("✅ Guardado en users como question");

      await setDoc(waitingRef, { uid: userId, questionIndex });
      console.log("✅ Guardado en waiting/qa");

      showResult("Eres el primero. Te tocó la PREGUNTA. Esperando a tu pareja...");
      listenForMatch(userId);

    } else {
      // Había alguien esperando → asigno respuesta
      const otherId = waitingSnap.data().uid;
      const questionIndex = waitingSnap.data().questionIndex;
      console.log("🔗 Encontrado esperando:", otherId, "con pregunta:", qaPairs[questionIndex].q);

      await setDoc(doc(db, "users", userId), {
        uid: userId,
        role: "answer",
        questionIndex,
        question: qaPairs[questionIndex].q,
        answer: qaPairs[questionIndex].a,
        photoURL,
        matchWith: otherId,
        createdAt: Date.now()
      });
      console.log("✅ Guardado en users como answer");

      await setDoc(doc(db, "users", otherId), { matchWith: userId }, { merge: true });
      console.log("✅ Actualizado el otro usuario con mi UID");

      await deleteDoc(waitingRef);
      console.log("🗑️ Eliminado waiting/qa");

      showResult("¡Tienes match! A ti te tocó la RESPUESTA 🎉");
    }

  } catch (err) {
    console.error("❌ Error en el flujo:", err);
    alert("Error en el registro. Revisa la consola.");
  } finally {
    submitBtn.disabled = false;
  }
});

function listenForMatch(myUid) {
  const meRef = doc(db, "users", myUid);
  onSnapshot(meRef, (snap) => {
    if (!snap.exists()) return;
    const me = snap.data();
    if (me.matchWith) {
      console.log("🎉 Tu pareja llegó:", me.matchWith);
      showResult("¡Tu pareja llegó! Están emparejados 🎉");
    }
  });
}
