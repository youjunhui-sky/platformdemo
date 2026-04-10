import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ schema: 'base', name: 'sys_audit_log' })
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  username: string | null;

  @Column({ name: 'real_name', type: 'varchar', length: 100, nullable: true })
  realName: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  module: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  action: string | null;

  @Column({ name: 'request_method', type: 'varchar', length: 10, nullable: true })
  requestMethod: string | null;

  @Column({ name: 'request_url', type: 'varchar', length: 500, nullable: true })
  requestUrl: string | null;

  @Column({ name: 'request_params', type: 'text', nullable: true })
  requestParams: string | null;

  @Column({ name: 'request_body', type: 'text', nullable: true })
  requestBody: string | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 50, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'response_code', type: 'int', nullable: true })
  responseCode: number | null;

  @Column({ name: 'response_body', type: 'text', nullable: true })
  responseBody: string | null;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs: number | null;

  @Column({ name: 'error_message', type: 'varchar', length: 500, nullable: true })
  errorMessage: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string | null;

  @Column({ name: 'device_info', type: 'varchar', length: 100, nullable: true })
  deviceInfo: string | null;

  @Column({ name: 'session_id', type: 'varchar', length: 100, nullable: true })
  sessionId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}