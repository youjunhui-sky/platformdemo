import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity({ schema: 'base', name: 'sys_token_blacklist' })
export class TokenBlacklist {
  @PrimaryColumn('varchar', { length: 100, name: 'token_jti' })
  tokenJti: string;

  @Column('uuid', { name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'revoked_at', type: 'timestamptz' })
  revokedAt: Date;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt: Date;
}