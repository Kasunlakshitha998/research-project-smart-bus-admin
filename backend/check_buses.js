const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
  });
}

const db = admin.firestore();

async function checkBuses() {
  const snapshot = await db.collection("buses").get();
  console.log(`Total buses: ${snapshot.size}`);

  const limitedSnapshot = await db.collection("buses").limit(3).get();
  limitedSnapshot.forEach((doc) => {
    console.log(`ID: ${doc.id}`);
    console.log(JSON.stringify(doc.data(), null, 2));
  });
  process.exit();
}

checkBuses();
