import { db, storage } from "./firebase-config.js";
import {
  collection, doc, setDoc, getDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Elementos del DOM
const fileInput = document.getElementById("fileInput");
const colorSelect = document.getElementById("colorSelect");
const submitBtn = document.getElementById("submitBtn");
const resultDiv = document.getElementById("result");
const matchInfo = document.getElementById("matchInfo");
const myPhoto = document.getElementById("myPhoto");
const quizQuestion = document.getElementById("quizQuestion");
const quizAnswer = document.getElementById("quizAnswer");

// ID único por usuario
const userId = "u_" + Math.random().toString(36).substring(2, 10);

// Banco de preguntas
const quiz = [
  { q: "¿Cuál es el planeta más cercano al sol?", a: "Mercurio" },
  { q: "¿En qué continente está Egipto?", a: "África" },
  { q: "¿Cuántos lados tiene un hexágono?", a: "6" },
  { q: "¿Quién pintó la Mona Lisa?", a: "Leonardo da Vinci" },
  { q: "¿Cuál es el océano más grande?", a: "Océano Pacífico" },
  { q: "¿Qué gas respiramos principalmente?", a: "Oxígeno" },
  { q: "¿En qué año llegó el hombre a la Luna?", a: "1969" },
  { q: "¿Cuál es el país con más habitantes?", a: "China" },
  { q: "¿Qué instrumento tiene teclas blancas y negras?", a: "Piano" },
  { q: "¿Qué animal es conocido como el rey de la selva?", a: "León" }
];

// Selección aleatoria de pregunta
const randomQuestion = quiz[Math.floor(Math.random() * quiz.length)];
quizQuestion.textContent = randomQuestion.q;

// Evento de click en Participar
submitBtn.addEventListener("click", async () => {
  const color = colorSelect.value;
  const answer = quizAnswer.value.trim();

  if (!color || !answer) {
    alert("Debes elegir un color y responder la pregunta");
    return;
  }

  // Subir foto si existe
  let photoURL = null;
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const storageRef = ref(storage, `photos/${userId}_${file.name}`);
    await uploadBytes(storageRef, file);
    photoURL = await getDownloadURL(storageRef);
    myPhoto.src = photoURL;
  }

  // Ver si hay alguien esperando en este color
  const waitingRef = doc(db, "waiting", color);
  const waitingSnap = await getDoc(waitingRef);

  let role, matchText;

  if (!waitingSnap.exists()) {
    // Nadie esperando → me guardo como "pregunta"
    role = "question";
    await setDoc(doc(db, "users", userId), {
      uid: userId,
      color,
      role,
      question: randomQuestion.q,
      answer,
      photoURL,
      matchWith: null
    });
    await setDoc(waitingRef, { uid: userId });
    matchText = "Eres la primera persona de este color, espera a tu pareja 👀";
  } else {
    // Ya había alguien esperando → yo soy la respuesta
    const otherId = waitingSnap.data().uid;
    role = "answer";

    await setDoc(doc(db, "users", userId), {
      uid: userId,
      color,
      role,
      question: randomQuestion.q,
      answer,
      photoURL,
      matchWith: otherId
    });

    await setDoc(doc(db, "users", otherId), { matchWith: userId }, { merge: true });
    await deleteDoc(waitingRef);

    matchText = `¡Tienes match con otra persona del color ${color}! 🎉`;
  }

  // Mostrar resultado
  matchInfo.textContent = matchText;
  resultDiv.style.display = "block";
});


