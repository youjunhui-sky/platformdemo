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

@Entity({ schema: 'pacs', name: 'pacs_imaging_study' })
export class ImagingStudy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'patient_id', nullable: true })
  patientId: string | null;

  @ManyToOne(() => Patient, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ type: 'varchar', length: 20, nullable: true })
  modality: string | null;

  @Column({ type: 'date', name: 'study_date', nullable: true })
  studyDate: Date | null;

  @Column({ type: 'varchar', name: 'body_part', length: 50, nullable: true })
  bodyPart: string | null;

  @Column({ type: 'text', nullable: true })
  findings: string | null;

  @Column({ type: 'text', nullable: true })
  impression: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  radiologist: string | null;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ type: 'timestamptz', name: 'report_time', nullable: true })
  reportTime: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column('uuid', { name: 'created_by', nullable: true })
  createdBy: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}