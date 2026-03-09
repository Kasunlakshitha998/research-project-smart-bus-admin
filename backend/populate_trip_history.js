/**
 * populate_trip_history.js
 * Clears and re-populates 60 days of trip history for every route in MySQL.
 * Usage: node populate_trip_history.js
 */
const db = require("./config/db");

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

async function populateTripHistory() {
  try {
    // 1. Clear existing trip history
    console.log("Clearing existing trip history...");
    await db.execute("DELETE FROM trip_history");
    console.log("Existing trip history cleared.");

    // 2. Get all routes
    console.log("Fetching routes...");
    const [routes] = await db.execute("SELECT id, route_number FROM routes");
    console.log(`Found ${routes.length} routes.`);

    if (routes.length === 0) {
      console.warn("No routes found. Please run the seed first.");
      return;
    }

    // 3. Build bulk INSERT for 60 days of data per route
    const today = new Date();
    const rows = [];

    for (const route of routes) {
      console.log(
        `Preparing 60 days for Route: ${route.route_number || route.id}...`,
      );

      for (let i = 0; i < 60; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const tripDate = formatDate(date);
        const passengerCount = getRandomInt(1200, 1800);
        rows.push(`(${route.id}, '${tripDate}', ${passengerCount})`);
      }
    }

    // 4. Insert in chunks of 500 rows to avoid packet size limits
    const CHUNK_SIZE = 500;
    let total = 0;

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const sql = `INSERT INTO trip_history (route_id, trip_date, passenger_count) VALUES ${chunk.join(", ")}`;
      await db.execute(sql);
      total += chunk.length;
      console.log(`Inserted ${total} / ${rows.length} rows...`);
    }

    console.log(
      `\n✅ Successfully populated ${rows.length} trip history records (60 days × ${routes.length} routes).`,
    );
  } catch (error) {
    console.error("Error populating trip history:", error.message);
  } finally {
    await db.end();
    process.exit(0);
  }
}

populateTripHistory();
