

import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity({ schema: 'base', name: 'sys_user_session', synchronize: false })
export class UserSession {
  @PrimaryColumn('varchar', { name: 'session_id', length: 500 })
  sessionId: string;

  @Index()
  @Column('uuid', { name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column('varchar', { length: 100, name: 'refresh_token_jti' })
  refreshTokenJti: string;

  @Column('varchar', { name: 'device_info', length: 255, nullable: true })
  deviceInfo: string | null;

  @Column('inet', { name: 'ip_address', nullable: true })
  ipAddress: string | null;

  @Column('varchar', { name: 'user_agent', length: 500, nullable: true })
  userAgent: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Index()
  @Column('timestamptz', { name: 'expires_at' })
  expiresAt: Date;

  @Column('boolean', { name: 'is_active', default: true })
  isActive: boolean;
}