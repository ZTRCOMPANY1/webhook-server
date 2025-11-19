// webhook.js
import fetch from "node-fetch";
import firebase from "firebase/compat/app";
import "firebase/compat/database";

const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_DATABASE_URL,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  WEBHOOK_URL,
  INTERVAL_MS
} = process.env;

if (!WEBHOOK_URL) {
  console.error("ERRO: WEBHOOK_URL não configurado nas env vars.");
  process.exit(1);
}

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  databaseURL: FIREBASE_DATABASE_URL,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

async function enviarRanking() {
  try {
    const snapshot = await db.ref('players').once('value');
    const players = snapshot.val();
    if (!players) return;

    const topPlayers = Object.keys(players)
      .map(user => ({ user, score: players[user].score || 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const mensagem = topPlayers.map((p, i) => `${i+1}. **${p.user}** - ${p.score} pts`).join("\n");

    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: `📊 **Ranking Atualizado**:\n${mensagem}` })
    });

    console.log("Ranking enviado:", new Date().toISOString());
  } catch (err) {
    console.error("Erro ao enviar ranking:", err);
  }
}

// Intervalo — padrão 1 minuto se não setado
const intervalo = parseInt(INTERVAL_MS || "60000", 10);

// Envia imediatamente e depois em loop
enviarRanking();
setInterval(enviarRanking, intervalo);

// Mantém o processo vivo (logs periódicos)
setInterval(() => console.log("Webhook rodando..."), 60000);
