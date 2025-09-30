import { db, storage } from "./firebase-config.js";
import {
  collection, doc, setDoc, getDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

const fileInput = document.getElementById("fileInput");
const colorSelect = document.getElementById("colorSelect");
const submitBtn = document.getElementById("submitBtn");
const resultDiv = document.getElementById("result");
const matchInfo = document.getElementById("matchInfo");
const myPhoto = document.getElementById("myPhoto");

const userId = "u_" + Math.random().toString(36).substring(2, 10);

submitBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  const color = colorSelect.value;
  if (!file || !color) {
    alert("Debes subir una foto y elegir un color");
    return;
  }

  // Subir foto
  const fileRef = ref(storage, `users/${userId}.jpg`);
  await uploadBytes(fileRef, file);
  const photoURL = await getDownloadURL(fileRef);

  // Ver si hay alguien esperando en este color
  const waitingRef = doc(db, "waiting", color);
  const waitingSnap = await getDoc(waitingRef);

  let role, matchText;

  if (!waitingSnap.exists()) {
    // Nadie esperando → me guardo como "pregunta" y quedo esperando
    role = "question";
    await setDoc(doc(db, "users", userId), {
      uid: userId,
      color,
      role,
      photoURL,
      matchWith: null
    });
    await setDoc(waitingRef, { uid: userId }); // marco como esperando
    matchText = "Eres la primera persona de este color, espera a tu pareja 👀";
  } else {
    // Ya había alguien esperando → yo soy la respuesta
    const otherId = waitingSnap.data().uid;
    role = "answer";

    // Guardar mi info
    await setDoc(doc(db, "users", userId), {
      uid: userId,
      color,
      role,
      photoURL,
      matchWith: otherId
    });

    // Actualizar al que estaba esperando con mi id
    await setDoc(doc(db, "users", otherId), { matchWith: userId }, { merge: true });

    // Borrar el "waiting"
    await deleteDoc(waitingRef);

    matchText = `¡Tienes match con otra persona del color ${color}! 🎉`;
  }

  // Mostrar en pantalla
  matchInfo.textContent = matchText;
  myPhoto.src = photoURL;
  resultDiv.style.display = "block";
});