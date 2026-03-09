const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();

// Firebase Initialization
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

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.orderBy("__name__").limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(db, query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    // When there are no documents left, we are done
    resolve();
    return;
  }

  // Delete documents in a batch
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recurse on the next process tick, to avoid
  // exploding the stack.
  process.nextTick(() => {
    deleteQueryBatch(db, query, resolve);
  });
}

async function populateTripHistory() {
  try {
    const collectionName = "trip_history";

    // 1. Clear existing history
    console.log("Clearing existing trip history...");
    await deleteCollection(collectionName);
    console.log("Existing trip history cleared.");

    // 2. Get all routes
    console.log("Fetching routes...");
    const routesSnapshot = await db.collection("routes").get();
    const routes = [];
    routesSnapshot.forEach((doc) => {
      routes.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Found ${routes.length} routes.`);

    // 3. Populate 60 days of data for each route
    const today = new Date();
    let batch = db.batch();
    let operationCount = 0;
    const MAX_BATCH_SIZE = 450;

    for (const route of routes) {
      console.log(
        `Populating 60 days for Route: ${route.route_number || route.id}...`
      );

      for (let i = 0; i < 60; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        const tripDate = formatDate(date);
        // Random pattern: weekends might have different counts? For now just random range
        const passengerCount = getRandomInt(1200, 1800);

        const docRef = db.collection(collectionName).doc();
        const data = {
          route_id: route.id,
          trip_date: tripDate,
          passenger_count: passengerCount,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
        };

        batch.set(docRef, data);
        operationCount++;

        if (operationCount >= MAX_BATCH_SIZE) {
          await batch.commit();
          console.log(`Committed batch of ${operationCount} operations.`);
          batch = db.batch();
          operationCount = 0;
        }
      }
    }

    // Final commit for remaining operations
    if (operationCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${operationCount} operations.`);
    }

    console.log(
      "Successfully populated 60 days of trip history for all routes."
    );
  } catch (error) {
    console.error("Error populating data:", error);
  }
}

populateTripHistory();
