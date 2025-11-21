import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';
// Initialize SQLite connection for Capacitor
const sqliteConnection = new SQLiteConnection(CapacitorSQLite);
export { sqliteConnection };
