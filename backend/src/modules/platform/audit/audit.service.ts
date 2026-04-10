import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { AuditLog } from '../../../entities/platform/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async findAll(query: any) {
    const { username, module, action, ipAddress, startDate, endDate, responseCode, page = 1, pageSize = 20 } = query;

    const queryBuilder = this.auditRepo.createQueryBuilder('log');

    if (username) {
      queryBuilder.andWhere('log.username LIKE :username', { username: `%${username}%` });
    }
    if (module) {
      queryBuilder.andWhere('log.module = :module', { module });
    }
    if (action) {
      queryBuilder.andWhere('log.action LIKE :action', { action: `%${action}%` });
    }
    if (ipAddress) {
      queryBuilder.andWhere('log.ipAddress::text LIKE :ipAddress', { ipAddress: `%${ipAddress}%` });
    }
    if (responseCode !== undefined) {
      queryBuilder.andWhere('log.responseCode = :responseCode', { responseCode });
    }
    if (startDate && endDate) {
      queryBuilder.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    } else if (startDate) {
      queryBuilder.andWhere('log.createdAt >= :startDate', { startDate: new Date(startDate) });
    } else if (endDate) {
      queryBuilder.andWhere('log.createdAt <= :endDate', { endDate: new Date(endDate) });
    }

    const [items, total] = await queryBuilder
      .orderBy('log.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page: Number(page), pageSize: Number(pageSize) };
  }

  async exportLogs(query: any) {
    const { username, module, action, ipAddress, startDate, endDate, responseCode } = query;

    const queryBuilder = this.auditRepo.createQueryBuilder('log');

    if (username) {
      queryBuilder.andWhere('log.username LIKE :username', { username: `%${username}%` });
    }
    if (module) {
      queryBuilder.andWhere('log.module = :module', { module });
    }
    if (action) {
      queryBuilder.andWhere('log.action LIKE :action', { action: `%${action}%` });
    }
    if (ipAddress) {
      queryBuilder.andWhere('log.ipAddress::text LIKE :ipAddress', { ipAddress: `%${ipAddress}%` });
    }
    if (responseCode !== undefined) {
      queryBuilder.andWhere('log.responseCode = :responseCode', { responseCode });
    }
    if (startDate && endDate) {
      queryBuilder.andWhere('log.createdAt BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    return queryBuilder.orderBy('log.createdAt', 'DESC').getMany();
  }

  async findById(id: string) {
    return this.auditRepo.findOneBy({ id });
  }

  async getStats(startDate?: string, endDate?: string) {
    const where: any = {};
    if (startDate && endDate) {
      where.createdAt = Between(new Date(startDate), new Date(endDate));
    }

    const totalCount = await this.auditRepo.count({ where });
    const successCount = await this.auditRepo.count({ where: { ...where, responseCode: 200 } });
    const failCount = totalCount - successCount;

    return { totalCount, successCount, failCount };
  }
}
