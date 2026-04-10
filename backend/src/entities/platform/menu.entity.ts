import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Relation,
  Index,
} from 'typeorm';

import { Subsystem } from './subsystem.entity';
import { Role } from './role.entity';

@Entity({ schema: 'base', name: 'sys_menu', synchronize: false })
export class Menu {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'parent_id', type: 'varchar', nullable: true })
  parentId: string | null;

  @ManyToOne(() => Menu, (menu) => menu.children, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: Menu | null;

  @OneToMany(() => Menu, (menu) => menu.parent)
  children: Menu[];

  @Column('uuid', { name: 'subsystem_id', nullable: true })
  subsystemId: string | null;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  code: string;

  @ManyToOne(() => Subsystem, (subsystem) => subsystem.menus, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subsystem_id' })
  subsystem: Subsystem | null;


  @Column('varchar', { length: 255, nullable: true })
  path: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  component: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  redirect: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  icon: string | null;

  @Column({ type: 'int', name: 'sort_order', default: 0 })
  sortOrder: number;

  @Column({ type: 'varchar', nullable: true })
  type: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  permission: string | null;

  @Column({ type: 'boolean', name: 'is_visible', default: true })
  isVisible: boolean;

  @Column({ type: 'boolean', name: 'is_cache', default: false })
  isCache: boolean;

  @Column({ type: 'boolean', name: 'is_frame', default: false })
  isFrame: boolean;

  @Column({ type: 'int', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}