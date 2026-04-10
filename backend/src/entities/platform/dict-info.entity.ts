import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ schema: 'base', name: 'sys_dict_info' })
export class DictInfo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  value: string | null;

  @Column('uuid', { name: 'type_id' })
  typeId: string;

  @Column({ type: 'varchar', name: 'parent_id', nullable: true })
  parentId: string | null;

  @Column({ type: 'int', name: 'order_num', default: 0 })
  orderNum: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  remark: string | null;

  @Column({ type: 'int', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}