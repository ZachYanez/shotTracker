import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { migrations } from './migrations';

let databasePromise: Promise<SQLiteDatabase> | null = null;

async function getCurrentVersion(database: SQLiteDatabase) {
  const rows = await database.getAllAsync<{ user_version: number }>('PRAGMA user_version;');
  return rows[0]?.user_version ?? 0;
}

export async function getDatabase() {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync('shot-tracker.db');
  }

  return databasePromise;
}

export async function initializeDatabase() {
  const database = await getDatabase();
  let currentVersion = await getCurrentVersion(database);

  for (const migration of migrations) {
    if (migration.version <= currentVersion) {
      continue;
    }

    await database.execAsync('BEGIN;');

    try {
      for (const statement of migration.statements) {
        await database.execAsync(statement);
      }

      await database.execAsync(`PRAGMA user_version = ${migration.version};`);
      await database.execAsync('COMMIT;');
      currentVersion = migration.version;
    } catch (error) {
      await database.execAsync('ROLLBACK;');
      throw error;
    }
  }

  return database;
}
