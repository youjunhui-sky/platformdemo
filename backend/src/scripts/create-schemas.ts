import { AppDataSource } from '../database/data-source';

async function createSchemas() {
  await AppDataSource.initialize();

  await AppDataSource.query('CREATE SCHEMA IF NOT EXISTS base');
  console.log('Created base schema');

  await AppDataSource.query('CREATE SCHEMA IF NOT EXISTS his');
  console.log('Created his schema');

  await AppDataSource.query('CREATE SCHEMA IF NOT EXISTS lis');
  console.log('Created lis schema');

  await AppDataSource.query('CREATE SCHEMA IF NOT EXISTS pacs');
  console.log('Created pacs schema');

  console.log('All schemas created successfully');
  await AppDataSource.destroy();
  process.exit(0);
}

createSchemas();