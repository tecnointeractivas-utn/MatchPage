// app.js
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

// -----------------------------
// DOM
// -----------------------------
const fileInput  = document.getElementById("fileInput");
const submitBtn  = document.getElementById("submitBtn");
const resultDiv  = document.getElementById("result");
const matchInfo  = document.getElementById("matchInfo");
const myPhoto    = document.getElementById("myPhoto");

// (Ignoramos el select de color para esta lógica)
const colorSelect = document.getElementById("colorSelect");

// Elemento auxiliar para mostrar tu asignación
let myAssignmentEl = document.getElementById("myAssignment");
if (!myAssignmentEl) {
  myAssignmentEl = document.createElement("p");
  myAssignmentEl.id = "myAssignment";
  myAssignmentEl.style.marginTop = "10px";
  resultDiv.appendChild(myAssignmentEl);
}

// Elemento auxiliar para mostrar la asignación de la pareja (si hay match)
let partnerAssignmentEl = document.getElementById("partnerAssignment");
if (!partnerAssignmentEl) {
  partnerAssignmentEl = document.createElement("p");
  partnerAssignmentEl.id = "partnerAssignment";
  partnerAssignmentEl.style.marginTop = "8px";
  resultDiv.appendChild(partnerAssignmentEl);
}

// -----------------------------
// Estado
// -----------------------------
const userId = "u_" + Math.random().toString(36).substring(2, 10);

// Banco de 10 preguntas con su respuesta
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

// -----------------------------
// Helpers de UI
// -----------------------------
function showResultCard(message) {
  matchInfo.textContent = message;
  resultDiv.style.display = "block";
}

function renderMyAssignment(role, qIdx) {
  const pair = qaPairs[qIdx];
  if (!pair) return;

  if (role === "question") {
    myAssignmentEl.textContent = `🧩 Tu rol: PREGUNTA → "${pair.q}"`;
  } else {
    myAssignmentEl.textContent = `🧩 Tu rol: RESPUESTA → "${pair.a}"`;
  }
}

function renderPartnerAssignment(role, qIdx) {
  const pair = qaPairs[qIdx];
  if (!pair) return;

  if (role === "question") {
    // Si yo soy pregunta, mi pareja es respuesta
    partnerAssignmentEl.textContent = `👥 Tu pareja tiene la RESPUESTA: "${pair.a}"`;
  } else {
    // Si yo soy respuesta, mi pareja es pregunta
    partnerAssignmentEl.textContent = `👥 Tu pareja tiene la PREGUNTA: "${pair.q}"`;
  }
}

// -----------------------------
// Lógica principal de emparejamiento Q/A
// -----------------------------
//
// Flujo:
// 1) Reviso si hay alguien esperando en "waiting/qa".
//    - Si NO hay: me convierto en "question", se me asigna una pregunta aleatoria,
//                 guardo mi doc y quedo esperando.
//    - Si SÍ hay: me convierto en "answer" de LA MISMA pregunta del que esperaba,
//                 creo mi doc, vinculo match con el otro y borro "waiting/qa".
//
submitBtn.addEventListener("click", async () => {
  submitBtn.disabled = true;

  try {
    // Subir foto si existe (opcional)
    let photoURL = null;
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const storageRef = ref(storage, `photos/${userId}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      photoURL = await getDownloadURL(storageRef);
      if (myPhoto) myPhoto.src = photoURL;
    }

    // Leer si alguien está esperando
    const waitingRef = doc(db, "waiting", "qa");
    const waitingSnap = await getDoc(waitingRef);

    if (!waitingSnap.exists()) {
      // Nadie esperando: me toca ser PREGUNTA
      const questionIndex = Math.floor(Math.random() * qaPairs.length);
      const role = "question";

      // Guardo mi usuario
      await setDoc(doc(db, "users", userId), {
        uid: userId,
        role,
        questionIndex,
        question: qaPairs[questionIndex].q,
        answer: qaPairs[questionIndex].a, // guardamos también por conveniencia
        photoURL: photoURL || null,
        matchWith: null,
        createdAt: Date.now()
      });

      // Me marco como "esperando" con esa pregunta concreta
      await setDoc(waitingRef, { uid: userId, questionIndex });

      showResultCard("Eres la primera persona. Quedas con una PREGUNTA asignada y a la espera de tu pareja 👀");
      renderMyAssignment(role, questionIndex);

      // Comienzo a escuchar mi doc para enterarme cuando llegue la pareja
      listenForMatch(userId);
    } else {
      // Ya había alguien esperando: me toca ser RESPUESTA de esa misma pregunta
      const otherId = waitingSnap.data().uid;
      const questionIndex = waitingSnap.data().questionIndex;
      const role = "answer";

      // Guardo mi usuario
      await setDoc(doc(db, "users", userId), {
        uid: userId,
        role,
        questionIndex,
        question: qaPairs[questionIndex].q,
        answer: qaPairs[questionIndex].a,
        photoURL: photoURL || null,
        matchWith: otherId,
        createdAt: Date.now()
      });

      // Actualizo al que estaba esperando con mi id (match hecho)
      await setDoc(doc(db, "users", otherId), { matchWith: userId }, { merge: true });

      // Borro el "waiting" (ya no hay nadie esperando)
      await deleteDoc(waitingRef);

      showResultCard("¡Match realizado! A ti te tocó la RESPUESTA de la misma pregunta 🎉");
      renderMyAssignment(role, questionIndex);
      renderPartnerAssignment(role, questionIndex);
    }
  } catch (err) {
    console.error(err);
    showResultCard("Ocurrió un error. Reintenta por favor.");
  } finally {
    submitBtn.disabled = false;
  }
});

// -----------------------------
// Listener para quien quedó esperando (rol: question)
// Apenas llegue su pareja, actualizamos UI en tiempo real.
// -----------------------------
function listenForMatch(myUid) {
  const meRef = doc(db, "users", myUid);

  const unsub = onSnapshot(meRef, async (snap) => {
    if (!snap.exists()) return;

    const me = snap.data();
    // Solo nos interesa cuando se completa el match
    if (me.matchWith) {
      renderPartnerAssignment(me.role, me.questionIndex);
      showResultCard("¡Ya llegó tu pareja! Están emparejados 🎉");
      unsub();
    }
  });
}

// (Opcional) Esconder el selector de color ya que no se usa
try {
  if (colorSelect) {
    colorSelect.parentElement.style.display = "none";
  }
} catch (_) {
  // No hacemos nada si falla
}
