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

import { Role } from './role.entity';
import { Menu } from './menu.entity';


@Entity({ schema: 'base', name: 'sys_subsystem', synchronize: false })
export class Subsystem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column('varchar', { length: 50 })
  code: string;

  @Column('varchar', { length: 100 })
  name: string;

  @Index({ unique: true })
  @Column('varchar', { name: 'app_id', length: 100 })
  appId: string;

  @Column('varchar', { name: 'app_secret_hash', length: 255 })
  appSecretHash: string;

  @Column('varchar', { length: 500 })
  domain: string;

  @Column('varchar', { name: 'logo_url', length: 500, nullable: true })
  logoUrl: string | null;

  @Column('varchar', { length: 500, nullable: true })
  description: string | null;

  @Column('varchar', { length: 20, default: 'pending' })
  status: string;

  @Column('varchar', { name: 'auth_type', length: 20, default: 'jwt' })
  authType: string;

  @Column('boolean', { name: 'sso_enabled', default: true })
  ssoEnabled: boolean;

  @Column('boolean', { name: 'auto_logout_sync', default: true })
  autoLogoutSync: boolean;

  @Column('varchar', { name: 'menu_sync_url', length: 500, nullable: true })
  menuSyncUrl: string | null;

  @Column('varchar', { name: 'callback_url', length: 500, nullable: true })
  callbackUrl: string | null;

  @Column('varchar', { name: 'health_check_url', length: 500, nullable: true })
  healthCheckUrl: string | null;

  @Column('int', { name: 'health_check_interval', default: 60 })
  healthCheckInterval: number;

  @Column('timestamptz', { name: 'last_health_at', nullable: true })
  lastHealthAt: Date | null;

  @Column('jsonb', { default: {} })
  metadata: Record<string, any>;

  @Column('timestamptz', { name: 'registered_at', nullable: true })
  registeredAt: Date | null;

  @Column('uuid', { name: 'registered_by', nullable: true })
  registeredBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Populated via RoleSubsystem join entity
  roles: Relation<Role[]>;

  @OneToMany(() => Menu, (menu) => menu.subsystem)
  menus: Menu[];
}
