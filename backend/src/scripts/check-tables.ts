import { AppDataSource } from '../database/data-source';

async function checkAllSchemas() {
  await AppDataSource.initialize();

  // Check base schema
  const baseTables = await AppDataSource.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'base'"
  ) as { table_name: string }[];
  console.log('Tables in base schema:', baseTables.map((t: { table_name: string }) => t.table_name));

  // Check if table exists in public
  const publicTables = await AppDataSource.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%data_permission%'"
  ) as { table_name: string }[];
  console.log('Tables in public schema:', publicTables.map((t: { table_name: string }) => t.table_name));

  // Check sys_data_permission_rule columns
  const cols = await AppDataSource.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'sys_data_permission_rule' AND table_schema = 'base'"
  ) as { column_name: string }[];
  console.log('Current columns:', cols.map((c: { column_name: string }) => c.column_name));

  await AppDataSource.destroy();
  process.exit(0);
}

checkAllSchemas();