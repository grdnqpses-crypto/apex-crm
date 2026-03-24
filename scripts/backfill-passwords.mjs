import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("No DATABASE_URL"); process.exit(1); }

const conn = await mysql.createConnection(DB_URL);

// Fetch all credential users with null plainTextPassword
const [rows] = await conn.execute(
  `SELECT id, username, name FROM users WHERE (loginMethod = 'credentials' OR username IS NOT NULL) AND plainTextPassword IS NULL`
);

console.log(`Found ${rows.length} users to backfill`);

for (const user of rows) {
  const username = user.username || user.name?.replace(/\s+/g, "");
  const plainPassword = `${username}@Apex1`;
  const hash = await bcrypt.hash(plainPassword, 12);
  await conn.execute(
    `UPDATE users SET passwordHash = ?, plainTextPassword = ? WHERE id = ?`,
    [hash, plainPassword, user.id]
  );
  console.log(`  ✓ ${user.name} (${user.username}) → ${plainPassword}`);
}

console.log("Done.");
await conn.end();
