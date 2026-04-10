import { AppDataSource } from '../database/data-source';

async function checkColumns() {
  await AppDataSource.initialize();

  const result = await AppDataSource.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 'sys_data_permission_rule' AND table_schema = 'base'"
  );

  console.log('Columns in sys_data_permission_rule:', JSON.stringify(result, null, 2));

  await AppDataSource.destroy();
  process.exit(0);
}

checkColumns();