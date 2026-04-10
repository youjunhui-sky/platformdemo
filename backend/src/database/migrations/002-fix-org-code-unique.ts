import { MigrationInterface, QueryRunner, TableUnique } from 'typeorm';

export class FixOrganizationCodeUnique1709600000000 implements MigrationInterface {
  name = 'FixOrganizationCodeUnique1709600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing unique constraint on code
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_org_code
    `);

    await queryRunner.query(`
      ALTER TABLE sys_organization DROP CONSTRAINT IF EXISTS sys_organization_code_key
    `);

    // Create new composite unique constraint on (parent_id, code)
    await queryRunner.query(`
      CREATE UNIQUE INDEX idx_org_parent_code ON sys_organization(parent_id, code)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IF EXISTS idx_org_parent_code
    `);

    await queryRunner.query(`
      ALTER TABLE sys_organization ADD CONSTRAINT sys_organization_code_key UNIQUE(code)
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_org_code ON sys_organization(code)
    `);
  }
}