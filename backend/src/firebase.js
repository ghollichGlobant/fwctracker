import { initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function initFirebase() {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (inlineJson) {
    // Cloud / Docker deploy — credentials as env var
    const serviceAccount = JSON.parse(inlineJson);
    initializeApp({ credential: cert(serviceAccount) });
  } else {
    // Local dev — uses GOOGLE_APPLICATION_CREDENTIALS file path
    initializeApp({ credential: applicationDefault() });
  }

  const db = getFirestore();
  return db;
}

const db = initFirebase();
export default db;
