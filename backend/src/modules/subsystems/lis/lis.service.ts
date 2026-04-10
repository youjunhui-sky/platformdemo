import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabTask } from '../../../entities/subsystems/lis/lab-task.entity';

@Injectable()
export class LisService {
  private readonly logger = new Logger(LisService.name);

  constructor(
    @InjectRepository(LabTask)
    private readonly labTaskRepo: Repository<LabTask>,
  ) {}

  async findAllTasks(query: any) {
    const { patientId, testType, status, resultStatus, page = 1, pageSize = 20 } = query;
    const queryBuilder = this.labTaskRepo
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.patient', 'patient');
    if (patientId) {
      queryBuilder.andWhere('task.patientId = :patientId', { patientId });
    }
    if (testType) {
      queryBuilder.andWhere('task.testType = :testType', { testType });
    }
    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }
    if (resultStatus) {
      queryBuilder.andWhere('task.resultStatus = :resultStatus', { resultStatus });
    }
    const [items, total] = await queryBuilder
      .orderBy('task.createdAt', 'DESC')
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

  async findTaskById(id: string) {
    const task = await this.labTaskRepo.findOne({
      where: { id },
      relations: ['patient'],
    });
    if (!task) {
      throw new NotFoundException('Lab task not found');
    }
    return task;
  }

  async createTask(dto: any, createdBy: string) {
    const task = this.labTaskRepo.create({
      ...dto,
      status: dto.status || 'pending',
      createdBy,
    });
    return this.labTaskRepo.save(task);
  }

  async updateTask(id: string, dto: any) {
    const task = await this.labTaskRepo.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('Lab task not found');
    }
    Object.assign(task, dto);
    await this.labTaskRepo.save(task);
    return this.findTaskById(id);
  }

  async saveResult(id: string, result: string, labUser: string) {
    const task = await this.labTaskRepo.findOne({ where: { id } });
    if (!task) {
      throw new NotFoundException('Lab task not found');
    }
    task.result = result;
    task.status = 'completed';
    task.resultStatus = 'normal';
    task.reportTime = new Date();
    task.labUser = labUser;
    await this.labTaskRepo.save(task);
    return this.findTaskById(id);
  }

  async getStats() {
    const pendingCount = await this.labTaskRepo.count({ where: { status: 'pending' } });
    const completedCount = await this.labTaskRepo.count({ where: { status: 'completed' } });
    const totalCount = await this.labTaskRepo.count();
    return {
      pendingCount,
      completedCount,
      totalCount,
    };
  }
}