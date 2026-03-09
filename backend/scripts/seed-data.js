require("dotenv").config();
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION (LOADED FROM .env)
// ==========================================

const FIREBASE_CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY,
};

// ==========================================

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: FIREBASE_CONFIG.projectId,
    clientEmail: FIREBASE_CONFIG.clientEmail,
    privateKey: FIREBASE_CONFIG.privateKey.replace(/\\n/g, "\n"),
  }),
  databaseURL: FIREBASE_CONFIG.databaseURL,
});

const db = admin.firestore();

const collections = [
  { name: "roles", file: "./data/roles.json" },
  { name: "permissions", file: "./data/permissions.json" },
  { name: "role_permissions", file: "./data/role_permissions.json" },
  { name: "routes", file: "./data/routes.json" },
  { name: "system_users", file: "./data/system_users.json" },
  { name: "complaints", file: "./data/complaints.json" },
];

/**
 * Helper to convert date strings to Firestore Timestamps
 * Searches for ISO date patterns (e.g., 2025-11-22T19:42:18.000Z)
 */
const processData = (data) => {
  const result = { ...data };
  for (const key in result) {
    const val = result[key];
    if (
      typeof val === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val)
    ) {
      result[key] = admin.firestore.Timestamp.fromDate(new Date(val));
    } else if (
      val &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      val !== null
    ) {
      result[key] = processData(val); // Recursive for nested objects
    }
  }
  return result;
};

const seedData = async () => {
  console.log("🚀 Starting Database Seeding...\n");

  for (const collection of collections) {
    console.log(`📂 Processing collection: ${collection.name}...`);
    const filePath = path.join(__dirname, collection.file);

    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  File not found: ${filePath}. Skipping...\n`);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const batch = db.batch();
    let count = 0;

    for (const [id, docData] of Object.entries(data)) {
      const docRef = db.collection(collection.name).doc(id);
      batch.set(docRef, processData(docData));
      count++;

      // Firestore limits each batch to 500 operations
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`   - Partial commit: ${count} docs...`);
      }
    }

    await batch.commit();
    console.log(
      `✅ Success! Seeded ${count} documents into [${collection.name}].\n`,
    );
  }

  console.log("🎊 Seeding process complete!");
  process.exit(0);
};

seedData().catch((err) => {
  console.error("\n❌ Seeding failed:", err);
  process.exit(1);
});
