import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { Role } from './role.entity';

@Entity({ schema: 'base', name: 'sys_user' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column('varchar', { length: 50 })
  username: string;

  @Column('varchar', { name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column('varchar', { name: 'real_name', length: 100 })
  realName: string;

  @Column('varchar', { length: 100, nullable: true })
  email: string | null;

  @Column('varchar', { length: 20, nullable: true })
  phone: string | null;

  @Column('varchar', { name: 'avatar_url', length: 500, nullable: true })
  avatarUrl: string | null;

  @Column('uuid', { name: 'org_id', nullable: true })
  orgId: string | null;

  @ManyToOne(() => Organization, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'org_id' })
  organization: Organization | null;

  @Column('smallint', { default: 1 })
  status: number;

  @Column('boolean', { name: 'is_first_login', default: true })
  isFirstLogin: boolean;

  @Column('timestamptz', { name: 'password_expire_at', nullable: true })
  passwordExpireAt: Date | null;

  @Column('timestamptz', { name: 'last_login_at', nullable: true })
  lastLoginAt: Date | null;

  @Column('inet', { name: 'last_login_ip', nullable: true })
  lastLoginIp: string | null;

  @Column('smallint', { name: 'login_fail_count', default: 0 })
  loginFailCount: number;

  @Column('timestamptz', { name: 'locked_until', nullable: true })
  lockedUntil: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column('uuid', { name: 'created_by', nullable: true })
  createdBy: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToMany(() => Role, (role) => role)
  @JoinTable({
    name: 'sys_user_role',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}