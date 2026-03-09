/**
 * run_seed.js
 * Runs schema.sql and seed.sql against the configured MySQL database.
 * Usage: node run_seed.js
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

async function runSQL(connection, filePath) {
  const sql = fs.readFileSync(filePath, "utf8");

  // Split on semicolons, filter empty statements
  const statements = sql
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    if (stmt.trim()) {
      await connection.query(stmt);
    }
  }
  console.log(`✅ Executed: ${path.basename(filePath)}`);
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "smart_bus",
    multipleStatements: true,
  });

  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    const seedPath = path.join(__dirname, "seed.sql");

    console.log("Running schema.sql...");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");
    await connection.query(schemaSQL);
    console.log("✅ schema.sql executed.");

    console.log("Running seed.sql...");
    const seedSQL = fs.readFileSync(seedPath, "utf8");
    await connection.query(seedSQL);
    console.log("✅ seed.sql executed.");

    console.log("\n🎉 Database setup complete!");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

main();
