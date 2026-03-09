const mysql = require("mysql2/promise");
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

// MySQL Initialization
const mysqlConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "sltb_db",
};

async function migrate() {
  let connection;
  try {
    connection = await mysql.createConnection(mysqlConfig);
    console.log("Connected to MySQL");

    const tables = [
      "roles",
      "permissions",
      "role_permissions",
      "system_users",
      "routes",
      "buses",
      "complaints",
      "trip_history",
    ];

    for (const table of tables) {
      console.log(`Migrating table: ${table}...`);
      const [rows] = await connection.execute(`SELECT * FROM ${table}`);

      const batch = db.batch();
      for (const row of rows) {
        // MySQL IDs are often integers, but Firestore uses strings.
        // We'll convert IDs to strings to maintain relationships during migration
        const id = row.id ? row.id.toString() : null;
        const data = { ...row };
        delete data.id; // Remove id from data body

        // Convert other foreign keys to strings
        if (data.role_id) data.role_id = data.role_id.toString();
        if (data.permission_id)
          data.permission_id = data.permission_id.toString();
        if (data.user_id) data.user_id = data.user_id.toString();
        if (data.bus_id) data.bus_id = data.bus_id.toString();
        if (data.current_route_id)
          data.current_route_id = data.current_route_id.toString();
        if (data.route_id) data.route_id = data.route_id.toString();

        // Convert Date objects to YYYY-MM-DD strings for date fields
        if (data.trip_date && data.trip_date instanceof Date) {
          data.trip_date = data.trip_date.toISOString().split("T")[0];
        }
        if (data.prediction_date && data.prediction_date instanceof Date) {
          data.prediction_date = data.prediction_date
            .toISOString()
            .split("T")[0];
        }

        if (id) {
          const docRef = db.collection(table).doc(id);
          batch.set(docRef, data);
        } else {
          const docRef = db.collection(table).doc();
          batch.set(docRef, data);
        }
      }
      await batch.commit();
      console.log(`Migrated ${rows.length} rows from ${table}`);
    }

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    if (connection) await connection.end();
  }
}

migrate();
