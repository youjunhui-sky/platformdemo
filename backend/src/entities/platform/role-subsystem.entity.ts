import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { Subsystem } from './subsystem.entity';

@Entity({ schema: 'base', name: 'sys_role_subsystem', synchronize: false })
export class RoleSubsystem {
  @PrimaryColumn('uuid', { name: 'role_id' })
  roleId: string;

  @PrimaryColumn('uuid', { name: 'subsystem_id' })
  subsystemId: string;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Subsystem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subsystem_id' })
  subsystem: Subsystem;

  @Column({ type: 'int', default: 1 })
  status: number;

  @Column({ type: 'timestamptz', name: 'granted_at', nullable: true })
  grantedAt: Date | null;
}