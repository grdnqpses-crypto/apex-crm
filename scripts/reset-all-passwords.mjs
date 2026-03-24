import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const newPassword = 'Axiom123';
const hash = await bcrypt.hash(newPassword, 10);

// Get all users
const [users] = await conn.execute('SELECT id, name, username FROM users');

let updated = 0;
for (const user of users) {
  await conn.execute(
    'UPDATE users SET passwordHash = ?, plainTextPassword = ? WHERE id = ?',
    [hash, newPassword, user.id]
  );
  console.log(`✓ Reset password for: ${user.name} (id: ${user.id})`);
  updated++;
}

console.log(`\nDone. Reset ${updated} user passwords to: ${newPassword}`);
await conn.end();
