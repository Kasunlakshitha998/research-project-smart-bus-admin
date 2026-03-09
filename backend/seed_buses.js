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

const models = [
  "Leyland Viking",
  "Tata LP",
  "Mitsubishi Rosa",
  "Isuzu Journey",
  "King Long",
];

async function seedMoreBuses() {
  const batch = db.batch();
  for (let i = 1; i <= 30; i++) {
    const busId = `BUS_${i}`;
    const busRef = db.collection("buses").doc(busId);
    batch.set(busRef, {
      license_plate: `NB-${1000 + i}`,
      capacity: Math.random() > 0.5 ? 52 : 32,
      model: models[Math.floor(Math.random() * models.length)],
      status: "active",
      current_route_id: null,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  await batch.commit();
  console.log("Seeded/Updated 30 dummy buses (fixed IDs)!");
  process.exit();
}

seedMoreBuses();
