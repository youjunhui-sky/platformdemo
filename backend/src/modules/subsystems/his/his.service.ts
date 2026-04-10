import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from '../../../entities/subsystems/his/patient.entity';
import { OutpatientRecord } from '../../../entities/subsystems/his/outpatient-record.entity';
import { InpatientRecord } from '../../../entities/subsystems/his/inpatient-record.entity';

@Injectable()
export class HisService {
  private readonly logger = new Logger(HisService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(OutpatientRecord)
    private readonly outpatientRepo: Repository<OutpatientRecord>,
    @InjectRepository(InpatientRecord)
    private readonly inpatientRepo: Repository<InpatientRecord>,
  ) {}

  async findAllPatients(query: any) {
    const { keyword, status, page = 1, pageSize = 20 } = query;
    const queryBuilder = this.patientRepo.createQueryBuilder('patient');
    if (keyword) {
      queryBuilder.andWhere(
        '(patient.name LIKE :keyword OR patient.phone LIKE :keyword OR patient.medicalRecordNo LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (status !== undefined) {
      queryBuilder.andWhere('patient.status = :status', { status });
    }
    const [items, total] = await queryBuilder
      .orderBy('patient.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findPatientById(id: string) {
    const patient = await this.patientRepo.findOne({ where: { id } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    return patient;
  }

  async createPatient(dto: any, createdBy: string) {
    const patient = this.patientRepo.create({
      ...dto,
      createdBy,
    });
    return this.patientRepo.save(patient);
  }

  async updatePatient(id: string, dto: any) {
    const patient = await this.patientRepo.findOne({ where: { id } });
    if (!patient) {
      throw new NotFoundException('Patient not found');
    }
    Object.assign(patient, dto);
    await this.patientRepo.save(patient);
    return this.findPatientById(id);
  }

  async findAllOutpatients(query: any) {
    const { patientId, department, doctor, page = 1, pageSize = 20 } = query;
    const queryBuilder = this.outpatientRepo
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.patient', 'patient');
    if (patientId) {
      queryBuilder.andWhere('record.patientId = :patientId', { patientId });
    }
    if (department) {
      queryBuilder.andWhere('record.department = :department', { department });
    }
    if (doctor) {
      queryBuilder.andWhere('record.doctor = :doctor', { doctor });
    }
    const [items, total] = await queryBuilder
      .orderBy('record.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async createOutpatient(dto: any, createdBy: string) {
    const outpatient = this.outpatientRepo.create({
      ...dto,
      createdBy,
    });
    return this.outpatientRepo.save(outpatient);
  }

  async findAllInpatients(query: any) {
    const { patientId, ward, doctor, status, page = 1, pageSize = 20 } = query;
    const queryBuilder = this.inpatientRepo
      .createQueryBuilder('record')
      .leftJoinAndSelect('record.patient', 'patient');
    if (patientId) {
      queryBuilder.andWhere('record.patientId = :patientId', { patientId });
    }
    if (ward) {
      queryBuilder.andWhere('record.ward = :ward', { ward });
    }
    if (doctor) {
      queryBuilder.andWhere('record.doctor = :doctor', { doctor });
    }
    if (status !== undefined) {
      queryBuilder.andWhere('record.status = :status', { status });
    }
    const [items, total] = await queryBuilder
      .orderBy('record.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const patientCount = await this.patientRepo.count({ where: { status: 1 } });
    const outpatientCount = await this.outpatientRepo.count({ where: { status: 1 } });
    const inpatientCount = await this.inpatientRepo.count({ where: { status: 1 } });
    const todayOutpatientCount = await this.outpatientRepo
      .createQueryBuilder('record')
      .where('record.visitTime >= :today', { today })
      .getCount();
    return {
      patientCount,
      outpatientCount,
      inpatientCount,
      todayOutpatientCount,
    };
  }
}