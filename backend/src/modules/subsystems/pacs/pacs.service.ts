import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImagingStudy } from '../../../entities/subsystems/pacs/imaging-study.entity';

@Injectable()
export class PacsService {
  private readonly logger = new Logger(PacsService.name);

  constructor(
    @InjectRepository(ImagingStudy)
    private readonly imagingRepo: Repository<ImagingStudy>,
  ) {}

  async findAllStudies(query: any) {
    const { patientId, modality, bodyPart, status, radiologist, page = 1, pageSize = 20 } = query;
    const queryBuilder = this.imagingRepo
      .createQueryBuilder('study')
      .leftJoinAndSelect('study.patient', 'patient');
    if (patientId) {
      queryBuilder.andWhere('study.patientId = :patientId', { patientId });
    }
    if (modality) {
      queryBuilder.andWhere('study.modality = :modality', { modality });
    }
    if (bodyPart) {
      queryBuilder.andWhere('study.bodyPart = :bodyPart', { bodyPart });
    }
    if (status) {
      queryBuilder.andWhere('study.status = :status', { status });
    }
    if (radiologist) {
      queryBuilder.andWhere('study.radiologist = :radiologist', { radiologist });
    }
    const [items, total] = await queryBuilder
      .orderBy('study.createdAt', 'DESC')
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

  async findStudyById(id: string) {
    const study = await this.imagingRepo.findOne({
      where: { id },
      relations: ['patient'],
    });
    if (!study) {
      throw new NotFoundException('Imaging study not found');
    }
    return study;
  }

  async createStudy(dto: any, createdBy: string) {
    const study = this.imagingRepo.create({
      ...dto,
      status: dto.status || 'pending',
      createdBy,
    });
    return this.imagingRepo.save(study);
  }

  async updateStudy(id: string, dto: any) {
    const study = await this.imagingRepo.findOne({ where: { id } });
    if (!study) {
      throw new NotFoundException('Imaging study not found');
    }
    Object.assign(study, dto);
    await this.imagingRepo.save(study);
    return this.findStudyById(id);
  }

  async saveReport(id: string, findings: string, impression: string, radiologist: string) {
    const study = await this.imagingRepo.findOne({ where: { id } });
    if (!study) {
      throw new NotFoundException('Imaging study not found');
    }
    study.findings = findings;
    study.impression = impression;
    study.radiologist = radiologist;
    study.status = 'completed';
    study.reportTime = new Date();
    await this.imagingRepo.save(study);
    return this.findStudyById(id);
  }

  async getStats() {
    const pendingCount = await this.imagingRepo.count({ where: { status: 'pending' } });
    const completedCount = await this.imagingRepo.count({ where: { status: 'completed' } });
    const totalCount = await this.imagingRepo.count();
    return {
      pendingCount,
      completedCount,
      totalCount,
    };
  }
}