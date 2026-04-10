import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

@Entity({ schema: 'base', name: 'sys_organization' })
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'parent_id', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Organization, (org) => org.children, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: Organization | null;

  @OneToMany(() => Organization, (org) => org.parent)
  children: Organization[];

  @Column('varchar', { length: 100 })
  name: string;

  @Index({ unique: true })
  @Column('varchar', { length: 50 })
  code: string;

  @Column('smallint', { default: 1 })
  level: number;

  @Column('smallint', { name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column('varchar', { length: 20 })
  type: string;

  @Column('smallint', { default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}