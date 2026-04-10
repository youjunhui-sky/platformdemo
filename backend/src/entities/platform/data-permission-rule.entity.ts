import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ schema: 'base', name: 'sys_data_permission_rule' })
export class DataPermissionRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'role_id' })
  roleId: string;

  @Column({ type: 'varchar', name: 'scope_type', default: 'all' })
  scopeType: string;

  @Column({ type: 'varchar', name: 'dept_ids', nullable: true })
  deptIds: string | null;
}