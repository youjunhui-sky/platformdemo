import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Patient } from './patient.entity';

@Entity({ schema: 'his', name: 'his_inpatient_record' })
export class InpatientRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ward: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  bedNo: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  doctor: string | null;

  @Column({ type: 'date', name: 'admit_date', nullable: true })
  admitDate: Date | null;

  @Column({ type: 'date', name: 'discharge_date', nullable: true })
  dischargeDate: Date | null;

  @Column({ type: 'text', nullable: true })
  diagnosis: string | null;

  @Column({ type: 'text', nullable: true })
  symptoms: string | null;

  @Column({ type: 'int', default: 1 })
  status: number;

  @Column({ type: 'int', default: 0 })
  fee: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column('uuid', { name: 'created_by', nullable: true })
  createdBy: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}