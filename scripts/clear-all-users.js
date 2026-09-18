import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SQLITE_FILE = path.join(__dirname, '..', 'server', 'database.sqlite');

try {
  const db = new Database(SQLITE_FILE);
  console.log('[Clear Users Script] Connected to SQLite database at:', SQLITE_FILE);

  db.exec(`
    DELETE FROM tasks;
    DELETE FROM categories;
    DELETE FROM feedback;
    DELETE FROM users;
  `);

  console.log('✅ Successfully deleted ALL current users, tasks, categories, and feedback records from the database!');
  db.close();
} catch (err) {
  console.error('🔴 Error clearing database:', err.message);
  process.exit(1);
}
