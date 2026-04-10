import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ schema: 'his', name: 'his_patient' })
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 10 })
  gender: string;

  @Column({ type: 'date', name: 'birth_date', nullable: true })
  birthDate: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'varchar', name: 'id_card', length: 20, nullable: true })
  idCard: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column('uuid', { name: 'org_id', nullable: true })
  orgId: string | null;

  @Column({ type: 'int', default: 1 })
  status: number;

  @Column({ type: 'varchar', name: 'medical_record_no', length: 50, nullable: true })
  medicalRecordNo: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  insuranceType: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column('uuid', { name: 'created_by', nullable: true })
  createdBy: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}