const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// ==========================================
// CONFIGURATION (PLACEHOLDERS - REPLACE THESE)
// ==========================================

// --- SOURCE PROJECT (FOR EXPORT) ---
const EXPORT_FIREBASE_CONFIG = {
  apiKey: "EXPORT_API_KEY",
  authDomain: "EXPORT_AUTH_DOMAIN",
  projectId: "EXPORT_PROJECT_ID",
  storageBucket: "EXPORT_STORAGE_BUCKET",
  messagingSenderId: "EXPORT_MESSAGING_SENDER_ID",
  appId: "EXPORT_APP_ID",
  databaseURL: "EXPORT_DATABASE_URL",
  // Note: Admin SDK still requires Service Account for full access
  clientEmail: "EXPORT_CLIENT_EMAIL",
  privateKey:
    "-----BEGIN PRIVATE KEY-----\nREPLACE_WITH_EXPORT_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
};

// --- DESTINATION PROJECT (FOR IMPORT) ---
const IMPORT_FIREBASE_CONFIG = {
  apiKey: "IMPORT_API_KEY",
  authDomain: "IMPORT_AUTH_DOMAIN",
  projectId: "IMPORT_PROJECT_ID",
  storageBucket: "IMPORT_STORAGE_BUCKET",
  messagingSenderId: "IMPORT_MESSAGING_SENDER_ID",
  appId: "IMPORT_APP_ID",
  databaseURL: "IMPORT_DATABASE_URL",
  // Note: Admin SDK still requires Service Account for full access
  clientEmail: "IMPORT_CLIENT_EMAIL",
  privateKey:
    "-----BEGIN PRIVATE KEY-----\nREPLACE_WITH_IMPORT_PRIVATE_KEY\n-----END PRIVATE KEY-----\n",
};

// ==========================================

/**
 * Firestore Selective Transfer Utility
 *
 * Usage:
 * 1. Export: node db-transfer.js export <output-file.json> [collection1,collection2...]
 * 2. Import: node db-transfer.js import <input-file.json>
 */

const mode = process.argv[2]; // export or import
const filePath = process.argv[3];
const collectionsArg = process.argv[4]; // comma-separated list for export

if (!mode || !filePath) {
  console.log("Usage:");
  console.log(
    "  Export: node db-transfer.js export <output.json> buses,routes",
  );
  console.log("  Import: node db-transfer.js import <input.json>");
  process.exit(1);
}

let config =
  mode === "export" ? EXPORT_FIREBASE_CONFIG : IMPORT_FIREBASE_CONFIG;

console.log(
  `Initializing for ${mode.toUpperCase()} on Project: ${config.projectId}...`,
);

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: config.projectId,
    clientEmail: config.clientEmail,
    privateKey: config.privateKey.replace(/\\n/g, "\n"),
  }),
  databaseURL: config.databaseURL,
});

const db = admin.firestore();

// Helper to handle Firestore types (Timestamps, Geos, etc.)
const serialize = (data) => {
  return JSON.parse(JSON.stringify(data));
};

async function exportData() {
  const collections = collectionsArg ? collectionsArg.split(",") : [];
  if (collections.length === 0) {
    console.error("Please specify collections to export (e.g., buses,routes)");
    process.exit(1);
  }

  const exportResult = {};

  for (const colName of collections) {
    console.log(`Exporting collection: ${colName}...`);
    const snapshot = await db.collection(colName).get();
    exportResult[colName] = {};

    snapshot.forEach((doc) => {
      exportResult[colName][doc.id] = doc.data();
    });
    console.log(`  - Exported ${snapshot.size} documents.`);
  }

  fs.writeFileSync(filePath, JSON.stringify(exportResult, null, 2));
  console.log(`\n✅ Success! Data exported to ${filePath}`);
}

async function importData() {
  const data = JSON.parse(fs.readFileSync(path.resolve(filePath), "utf8"));
  const collections = Object.keys(data);

  for (const colName of collections) {
    console.log(`Importing collection: ${colName}...`);
    const batch = db.batch();
    const docs = data[colName];
    let count = 0;

    for (const [docId, docData] of Object.entries(docs)) {
      const docRef = db.collection(colName).doc(docId);

      // Convert ISO strings back to Timestamps if needed (basic version)
      // This simple version treats them as objects/strings.
      // For a more robust version, we would check for _seconds fields.

      batch.set(docRef, docData);
      count++;

      // Firestore batch limit is 500
      if (count % 500 === 0) {
        await batch.commit();
        console.log(`  - Progress: ${count} docs...`);
      }
    }

    await batch.commit();
    console.log(`  - Success: Imported ${count} documents into ${colName}.`);
  }

  console.log(`\n✅ Success! Transfer complete.`);
}

if (mode === "export") {
  exportData().catch(console.error);
} else if (mode === "import") {
  importData().catch(console.error);
} else {
  console.error("Invalid mode. Use 'export' or 'import'.");
}
