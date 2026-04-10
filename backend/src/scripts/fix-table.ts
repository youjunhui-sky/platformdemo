import { AppDataSource } from '../database/data-source';

async function fixTable() {
  await AppDataSource.initialize();

  // Add missing columns
  try {
    await AppDataSource.query(
      "ALTER TABLE base.sys_data_permission_rule ADD COLUMN IF NOT EXISTS scope_type varchar(20)"
    );
    console.log('Added scope_type column');
  } catch (e: any) {
    console.log('scope_type:', e.message);
  }

  try {
    await AppDataSource.query(
      "ALTER TABLE base.sys_data_permission_rule ADD COLUMN IF NOT EXISTS dept_ids text"
    );
    console.log('Added dept_ids column');
  } catch (e: any) {
    console.log('dept_ids:', e.message);
  }

  // Verify columns
  const cols = await AppDataSource.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'sys_data_permission_rule' AND table_schema = 'base'"
  ) as { column_name: string }[];
  console.log('Updated columns:', cols.map((c: { column_name: string }) => c.column_name));

  await AppDataSource.destroy();
  process.exit(0);
}

fixTable();