import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Patient } from '../his/patient.entity';

@Entity({ schema: 'lis', name: 'lis_lab_task' })
export class LabTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'patient_id', nullable: true })
  patientId: string | null;

  @ManyToOne(() => Patient, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'varchar', length: 50, nullable: true })
  testType: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  itemName: string | null;

  @Column({ type: 'text', nullable: true })
  result: string | null;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ type: 'varchar', name: 'result_status', nullable: true })
  resultStatus: string | null;

  @Column({ type: 'timestamptz', name: 'report_time', nullable: true })
  reportTime: Date | null;

  @Column({ type: 'varchar', name: 'lab_user', length: 100, nullable: true })
  labUser: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column('uuid', { name: 'created_by', nullable: true })
  createdBy: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}