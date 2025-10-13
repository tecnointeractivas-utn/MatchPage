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
  { q: "¿Qué animal es conocido como el rey de la selva?", a: "León" },

  // 11-20
  { q: "¿Cuál es el río más largo del mundo?", a: "Amazonas" },
  { q: "¿Cuántos continentes hay en la Tierra?", a: "7" },
  { q: "¿Quién escribió Don Quijote de la Mancha?", a: "Miguel de Cervantes" },
  { q: "¿En qué país se encuentra la Torre Eiffel?", a: "Francia" },
  { q: "¿Cuál es el metal cuyo símbolo químico es Au?", a: "Oro" },
  { q: "¿En qué país se usó por primera vez la pólvora?", a: "China" },
  { q: "¿Cuál es el idioma más hablado en el mundo?", a: "Inglés" },
  { q: "¿Cuál es la capital de Japón?", a: "Tokio" },
  { q: "¿Cuántos colores tiene el arcoíris?", a: "7" },
  { q: "¿Qué número romano representa el 100?", a: "C" },

  // 21-30
  { q: "¿Cuál es la montaña más alta del mundo?", a: "Monte Everest" },
  { q: "¿Qué planeta es conocido como el planeta rojo?", a: "Marte" },
  { q: "¿Quién inventó la bombilla?", a: "Thomas Edison" },
  { q: "¿Cuál es la capital de Italia?", a: "Roma" },
  { q: "¿Cuántos huesos tiene el cuerpo humano adulto?", a: "206" },
  { q: "¿Qué continente se considera el más frío?", a: "Antártida" },
  { q: "¿Qué órgano bombea la sangre en el cuerpo?", a: "Corazón" },
  { q: "¿Cuál es el símbolo químico del agua?", a: "H2O" },
  { q: "¿Quién fue el primer presidente de Estados Unidos?", a: "George Washington" },
  { q: "¿Qué moneda se usa en la Unión Europea?", a: "Euro" },

  // 31-40
  { q: "¿Cuál es la capital de México?", a: "Ciudad de México" },
  { q: "¿Qué país tiene forma de bota?", a: "Italia" },
  { q: "¿En qué país nació Pablo Picasso?", a: "España" },
  { q: "¿Qué deporte practicaba Michael Jordan?", a: "Baloncesto" },
  { q: "¿Qué planeta tiene anillos visibles?", a: "Saturno" },
  { q: "¿Qué animal es el más rápido del mundo?", a: "Guepardo" },
  { q: "¿Qué gas utilizan las plantas para hacer la fotosíntesis?", a: "Dióxido de carbono" },
  { q: "¿Cuál es el país más grande del mundo?", a: "Rusia" },
  { q: "¿Qué vitamina produce el cuerpo con el sol?", a: "Vitamina D" },
  { q: "¿En qué ciudad está el Coliseo?", a: "Roma" },

  // 41-50
  { q: "¿Qué número viene después del 99?", a: "100" },
  { q: "¿Cuál es el planeta más grande del sistema solar?", a: "Júpiter" },
  { q: "¿Qué científico propuso la teoría de la relatividad?", a: "Albert Einstein" },
  { q: "¿Qué animal pone huevos y tiene pico?", a: "Ornitorrinco" },
  { q: "¿En qué país está el Taj Mahal?", a: "India" },
  { q: "¿Cuál es la capital de Argentina?", a: "Buenos Aires" },
  { q: "¿Cuántos días tiene un año bisiesto?", a: "366" },
  { q: "¿Qué planeta es conocido como el hermano de la Tierra?", a: "Venus" },
  { q: "¿Qué país ganó el Mundial de fútbol en 2010?", a: "España" },
  { q: "¿Qué elemento tiene el símbolo O?", a: "Oxígeno" },

  // 51-60
  { q: "¿Qué continente se llama también el viejo continente?", a: "Europa" },
  { q: "¿Cuál es el desierto más grande del mundo?", a: "Sahara" },
  { q: "¿En qué país se encuentra Machu Picchu?", a: "Perú" },
  { q: "¿Cuál es la capital de Alemania?", a: "Berlín" },
  { q: "¿Qué planeta tarda más en dar la vuelta al Sol?", a: "Neptuno" },
  { q: "¿Cuál es el ave símbolo de Estados Unidos?", a: "Águila calva" },
  { q: "¿En qué país nació Albert Einstein?", a: "Alemania" },
  { q: "¿Cuál es el idioma oficial de Brasil?", a: "Portugués" },
  { q: "¿Qué planeta es conocido como el gigante de hielo?", a: "Urano" },
  { q: "¿Qué órgano usa el ser humano para pensar?", a: "Cerebro" },

  // 61-70
  { q: "¿Cuál es el país más pequeño del mundo?", a: "Ciudad del Vaticano" },
  { q: "¿En qué continente está Australia?", a: "Oceanía" },
  { q: "¿Cuál es la capital de Canadá?", a: "Ottawa" },
  { q: "¿Qué instrumento se toca con arco?", a: "Violín" },
  { q: "¿Qué animal marino tiene ocho brazos?", a: "Pulpo" },
  { q: "¿Qué país tiene como bandera un círculo rojo sobre fondo blanco?", a: "Japón" },
  { q: "¿Qué planeta se conoce como el gemelo de Neptuno?", a: "Urano" },
  { q: "¿Qué ciudad es conocida como la Gran Manzana?", a: "Nueva York" },
  { q: "¿Qué animal produce miel?", a: "Abeja" },
  { q: "¿Qué día sigue al viernes?", a: "Sábado" },

  // 71-80
  { q: "¿Qué gas necesitamos para vivir?", a: "Oxígeno" },
  { q: "¿Qué instrumento musical tiene seis cuerdas?", a: "Guitarra" },
  { q: "¿Cuál es el planeta enano más famoso?", a: "Plutón" },
  { q: "¿Qué país tiene forma alargada y estrecha en Sudamérica?", a: "Chile" },
  { q: "¿Qué instrumento de viento tiene teclas y tubos?", a: "Órgano" },
  { q: "¿Qué animal es el mamífero más grande del planeta?", a: "Ballena azul" },
  { q: "¿Cuál es la capital de España?", a: "Madrid" },
  { q: "¿Qué número es la mitad de 100?", a: "50" },
  { q: "¿Qué planeta tiene un día más corto?", a: "Júpiter" },
  { q: "¿Qué instrumento de percusión usamos para marcar el ritmo?", a: "Tambor" }
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
