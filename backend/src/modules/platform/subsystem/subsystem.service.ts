import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Subsystem } from '../../../entities/platform/subsystem.entity';
import { Role } from '../../../entities/platform/role.entity';
import { UserRole } from '../../../entities/platform/user-role.entity';
import { RoleSubsystem } from '../../../entities/platform/role-subsystem.entity';
import { CryptoUtil } from '../../../common/utils/crypto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SubsystemService {
  private readonly logger = new Logger(SubsystemService.name);

  constructor(
    @InjectRepository(Subsystem)
    private readonly subsystemRepo: Repository<Subsystem>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(RoleSubsystem)
    private readonly roleSubsystemRepo: Repository<RoleSubsystem>,
  ) {}

  async findAll(page = 1, pageSize = 10, keyword?: string, status?: number) {
    const queryBuilder = this.subsystemRepo.createQueryBuilder('subsystem');
    if (keyword) {
      queryBuilder.andWhere(
        '(subsystem.name LIKE :keyword OR subsystem.code LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (status !== undefined) {
      queryBuilder.andWhere('subsystem.status = :status', { status });
    }
    const [data, total] = await queryBuilder
      .orderBy('subsystem.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return { data, total };
  }

  async findById(id: string) {
    const subsystem = await this.subsystemRepo.findOne({ where: { id } });
    if (!subsystem) {
      throw new NotFoundException('Subsystem not found');
    }
    return subsystem;
  }

  async findByCode(code: string) {
    const subsystem = await this.subsystemRepo.findOne({ where: { code } });
    if (!subsystem) {
      throw new NotFoundException('Subsystem not found');
    }
    return subsystem;
  }

  async create(dto: any, registeredBy: string) {
    const existing = await this.subsystemRepo.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException('Subsystem code already exists');
    }
    const appId = `app_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
    const appSecret = CryptoUtil.generateSecureToken(32);
    const appSecretHash = await CryptoUtil.hashPassword(appSecret);
    const subsystem = this.subsystemRepo.create({
      code: dto.code,
      name: dto.name,
      appId,
      appSecretHash,
      domain: dto.domain,
      logoUrl: dto.logoUrl,
      description: dto.description,
      authType: dto.authType || 'jwt',
      ssoEnabled: dto.ssoEnabled !== undefined ? dto.ssoEnabled : true,
      autoLogoutSync: dto.autoLogoutSync !== undefined ? dto.autoLogoutSync : true,
      menuSyncUrl: dto.menuSyncUrl,
      callbackUrl: dto.callbackUrl,
      healthCheckUrl: dto.healthCheckUrl,
      healthCheckInterval: dto.healthCheckInterval || 60,
      status: 'pending',
      registeredAt: new Date(),
      registeredBy,
    });
    const saved = await this.subsystemRepo.save(subsystem);
    this.logger.log(`Subsystem registered: ${saved.code} with appId: ${saved.appId}, appSecret: ${appSecret}`);
    return { ...saved, appSecret };
  }

  async update(id: string, dto: any) {
    const subsystem = await this.subsystemRepo.findOne({ where: { id } });
    if (!subsystem) {
      throw new NotFoundException('Subsystem not found');
    }
    Object.assign(subsystem, dto);
    return this.subsystemRepo.save(subsystem);
  }

  async updateStatus(id: string, status: string) {
    const subsystem = await this.subsystemRepo.findOne({ where: { id } });
    if (!subsystem) {
      throw new NotFoundException('Subsystem not found');
    }
    subsystem.status = status;
    await this.subsystemRepo.save(subsystem);
  }

  async remove(id: string) {
    const subsystem = await this.subsystemRepo.findOne({ where: { id } });
    if (!subsystem) {
      throw new NotFoundException('Subsystem not found');
    }
    await this.subsystemRepo.remove(subsystem);
  }

  async rotateSecret(id: string) {
    const subsystem = await this.subsystemRepo.findOne({ where: { id } });
    if (!subsystem) {
      throw new NotFoundException('Subsystem not found');
    }
    const newSecret = CryptoUtil.generateSecureToken(32);
    subsystem.appSecretHash = await CryptoUtil.hashPassword(newSecret);
    await this.subsystemRepo.save(subsystem);
    this.logger.log(`Subsystem ${subsystem.code} secret rotated`);
    return { appSecret: newSecret };
  }

  async healthCheck(id: string) {
    const subsystem = await this.subsystemRepo.findOne({ where: { id } });
    if (!subsystem) {
      throw new NotFoundException('Subsystem not found');
    }
    if (!subsystem.healthCheckUrl) {
      return { healthy: false, message: 'Health check URL not configured' };
    }
    try {
      const start = Date.now();
      const response = await fetch(subsystem.healthCheckUrl, {
        signal: AbortSignal.timeout(5000),
      });
      const latencyMs = Date.now() - start;
      subsystem.lastHealthAt = new Date();
      await this.subsystemRepo.save(subsystem);
      return {
        healthy: response.ok,
        latencyMs,
        message: `HTTP ${response.status}`,
      };
    } catch (err) {
      subsystem.lastHealthAt = new Date();
      await this.subsystemRepo.save(subsystem);
      return {
        healthy: false,
        message: String(err),
      };
    }
  }

  async getAccessibleSubsystems(userId: string) {
    const userRoles = await this.userRoleRepo
      .createQueryBuilder('ur')
      .select('ur.roleId', 'roleId')
      .where('ur.userId = :userId', { userId })
      .getRawMany();
    const roleIds = userRoles.map((ur) => ur.roleId);
    if (roleIds.length === 0) return [];
    const roleSubsystems = await this.roleSubsystemRepo
      .createQueryBuilder('rs')
      .select('rs.subsystemId', 'subsystemId')
      .where('rs.roleId IN (:...roleIds)', { roleIds })
      .andWhere('rs.status = :status', { status: 1 })
      .getRawMany();
    const subsystemIds = roleSubsystems.map((rs) => rs.subsystemId);
    if (subsystemIds.length === 0) return [];
    return this.subsystemRepo.find({
      where: { id: In(subsystemIds), status: 'active' },
    });
  }

  async verifySubsystemCredentials(appId: string, appSecret: string) {
    const subsystem = await this.subsystemRepo.findOne({ where: { appId } });
    if (!subsystem) {
      return null;
    }
    const isValid = await CryptoUtil.verifyPassword(appSecret, subsystem.appSecretHash);
    if (!isValid) {
      return null;
    }
    return subsystem;
  }
}