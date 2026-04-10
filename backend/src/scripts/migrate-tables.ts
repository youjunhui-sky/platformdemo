import { AppDataSource } from '../database/data-source';

async function migrateTables() {
  await AppDataSource.initialize();
  const ds = AppDataSource;

  // Get all tables in public schema
  const tables = await ds.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'sys_%' ORDER BY tablename"
  ) as { tablename: string }[];

  console.log('Found tables:', tables.map(t => t.tablename));

  for (const table of tables) {
    const tableName = table.tablename;
    try {
      // Move table to base schema
      await ds.query(`ALTER TABLE public.${tableName} SET SCHEMA base`);
      console.log(`Migrated: ${tableName}`);
    } catch (e: any) {
      console.error(`Failed to migrate ${tableName}:`, e.message);
    }
  }

  console.log('Migration completed');
  await ds.destroy();
  process.exit(0);
}

migrateTables();