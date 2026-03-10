/**
 * seed_buses.js
 * Seeds 30 dummy buses into the MySQL `buses` table.
 * Usage: node seed_buses.js
 */
const db = require("./config/db");

const models = [
  "Leyland Viking",
  "Tata LP",
  "Mitsubishi Rosa",
  "Isuzu Journey",
  "King Long",
];

async function seedMoreBuses() {
  console.log("Seeding 30 buses into MySQL...");

  const values = [];
  for (let i = 34; i <= 63; i++) {
    const license_plate = `NB-${1000 + i}`;
    const bus_number = `BUS_${i}`;
    const capacity = Math.random() > 0.5 ? 52 : 32;
    const model = models[Math.floor(Math.random() * models.length)];
    values.push(
      `('${license_plate}', '${bus_number}', ${capacity}, '${model}', 'active', NULL)`,
    );
  }

  const sql = `
    INSERT IGNORE INTO buses (license_plate, bus_number, capacity, model, status, current_route_id)
    VALUES ${values.join(",\n    ")};
  `;

  try {
    const [result] = await db.execute(sql);
    console.log(`Done! Inserted/skipped ${result.affectedRows} buses.`);
  } catch (err) {
    console.error("Error seeding buses:", err.message);
  } finally {
    await db.end();
    process.exit(0);
  }
}

seedMoreBuses();
