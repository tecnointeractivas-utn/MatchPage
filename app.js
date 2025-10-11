// app.js
import { db, storage } from "./firebase-config.js";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  runTransaction
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const fileInput  = document.getElementById("fileInput");
const fullName   = document.getElementById("fullName");
const colorSelect = document.getElementById("colorSelect");
const submitBtn  = document.getElementById("submitBtn");
const resultDiv  = document.getElementById("result");
const matchInfo  = document.getElementById("matchInfo");
const myPhoto    = document.getElementById("myPhoto");

// Juego
const gameSection    = document.getElementById("gameSection");
const assignmentText = document.getElementById("assignmentText");
const playerAnswer   = document.getElementById("playerAnswer");
const checkBtn       = document.getElementById("checkBtn");
const revealResult   = document.getElementById("revealResult");
const partnerPhoto   = document.getElementById("partnerPhoto");

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

let myRole = null;
let myQuestionIndex = null;
let partnerId = null;

function showResult(msg) {
  matchInfo.textContent = msg;
  resultDiv.style.display = "block";
}

submitBtn.addEventListener("click", async () => {
  const name = fullName.value.trim();
  const color = colorSelect.value;

  if (!name) {
    alert("Debes ingresar tu nombre y apellido");
    return;
  }
  if (!color) {
    alert("Debes seleccionar un color");
    return;
  }

  submitBtn.style.display = "none";
  submitBtn.remove();

  try {
    let photoURL = null;
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const storageRef = ref(storage, `photos/${userId}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      photoURL = await getDownloadURL(storageRef);
      myPhoto.src = photoURL;
    }

    // Cola específica por color
    const waitingRef = doc(db, "waiting", `qa_${color}`);

    // Usamos una transacción para evitar condiciones de carrera
    await runTransaction(db, async (transaction) => {
      const waitingSnap = await transaction.get(waitingRef);

      if (!waitingSnap.exists()) {
        // Nadie esperando en este color → me toca PREGUNTA
        const questionIndex = Math.floor(Math.random() * qaPairs.length);
        myRole = "question";
        myQuestionIndex = questionIndex;

        transaction.set(doc(db, "users", userId), {
          uid: userId,
          fullName: name,
          color,
          role: myRole,
          questionIndex,
          question: qaPairs[questionIndex].q,
          answer: qaPairs[questionIndex].a,
          photoURL,
          matchWith: null,
          createdAt: Date.now()
        });

        transaction.set(waitingRef, { uid: userId, questionIndex });

        showResult(`Eres el primero en ${color}. Te tocó una PREGUNTA. Esperando a tu pareja...`);
        assignmentText.textContent = `Tu PREGUNTA es: ${qaPairs[questionIndex].q}`;
        gameSection.style.display = "block";

        listenForMatch(userId);

      } else {
        // Ya había alguien esperando en este color → me toca RESPUESTA
        const otherId = waitingSnap.data().uid;
        const questionIndex = waitingSnap.data().questionIndex;
        myRole = "answer";
        myQuestionIndex = questionIndex;
        partnerId = otherId;

        transaction.set(doc(db, "users", userId), {
          uid: userId,
          fullName: name,
          color,
          role: myRole,
          questionIndex,
          question: qaPairs[questionIndex].q,
          answer: qaPairs[questionIndex].a,
          photoURL,
          matchWith: otherId,
          createdAt: Date.now()
        });

        transaction.set(doc(db, "users", otherId), { matchWith: userId }, { merge: true });
        transaction.delete(waitingRef);

        showResult(`¡Match realizado en ${color}! Te tocó una RESPUESTA.`);
        assignmentText.textContent = `Tu RESPUESTA es: ${qaPairs[questionIndex].a}`;
        gameSection.style.display = "block";
      }
    });

  } catch (err) {
    console.error(err);
    alert("Error en el registro. Revisa consola.");
  } finally {
    submitBtn.disabled = false;
  }
});

// Escuchar si me emparejaron
function listenForMatch(myUid) {
  const meRef = doc(db, "users", myUid);
  onSnapshot(meRef, async (snap) => {
    if (!snap.exists()) return;
    const me = snap.data();
    if (me.matchWith) {
      partnerId = me.matchWith;
      showResult("¡Tu pareja llegó! Están emparejados 🎉");
    }
  });
}

// Validación del juego
checkBtn.addEventListener("click", async () => {
  if (!myRole || myQuestionIndex === null) {
    alert("Primero debes registrarte");
    return;
  }
  const attempt = playerAnswer.value.trim();
  if (!attempt) {
    alert("Escribe una respuesta antes de comprobar");
    return;
  }

  const correctQ = qaPairs[myQuestionIndex].q;
  const correctA = qaPairs[myQuestionIndex].a;

  const partnerRef = doc(db, "users", partnerId);
  const partnerSnap = await getDoc(partnerRef);
  if (!partnerSnap.exists()) {
    revealResult.textContent = "❌ No se encontró tu pareja";
    return;
  }
  const partnerData = partnerSnap.data();

  let isCorrect = false;

  if (myRole === "question") {
    isCorrect = attempt.toLowerCase() === correctA.toLowerCase();
    revealResult.textContent = isCorrect
      ? `✅ ¡Correcto! Tu pareja (RESPUESTA) es: ${partnerData.fullName}`
      : "❌ Respuesta incorrecta. Intenta de nuevo.";
  } else if (myRole === "answer") {
    isCorrect = attempt.toLowerCase() === correctQ.toLowerCase();
    revealResult.textContent = isCorrect
      ? `✅ ¡Correcto! Tu pareja (PREGUNTA) es: ${partnerData.fullName}`
      : "❌ No coincide con la pregunta. Intenta de nuevo.";
  }

  // Mostrar foto solo si la respuesta es correcta y existe foto
  if (isCorrect && partnerData.photoURL) {
    partnerPhoto.src = partnerData.photoURL;
    partnerPhoto.style.display = "block";
  } else {
    partnerPhoto.style.display = "none";
  }
});
