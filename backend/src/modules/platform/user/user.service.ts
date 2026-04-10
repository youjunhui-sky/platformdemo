import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../../../entities/platform/user.entity';
import { Role } from '../../../entities/platform/role.entity';
import { UserSession } from '../../../entities/platform/user-session.entity';
import { CryptoUtil } from '../../../common/utils/crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserSession)
    private readonly sessionRepo: Repository<UserSession>,
    private readonly configService: ConfigService,
  ) {}

  async findAll(query: any) {
    const { keyword, orgId, status, page = 1, pageSize = 20 } = query;
    const queryBuilder = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'org')
      .leftJoinAndSelect('user.roles', 'role');
    if (keyword) {
      queryBuilder.andWhere(
        '(user.username LIKE :keyword OR user.realName LIKE :keyword OR user.email LIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }
    if (orgId) {
      queryBuilder.andWhere('user.orgId = :orgId', { orgId });
    }
    if (status !== undefined) {
      queryBuilder.andWhere('user.status = :status', { status });
    }
    const [items, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
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

  async findById(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['organization', 'roles', 'roles.subsystems'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async create(dto: CreateUserDto, createdBy: string) {
    const existing = await this.userRepo.findOne({ where: { username: dto.username } });
    if (existing) {
      throw new ConflictException('Username already exists');
    }
    if (dto.email) {
      const existingEmail = await this.userRepo.findOne({ where: { email: dto.email } });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }
    const defaultPassword = this.configService.get('security.defaultPassword', '123456');
    const passwordHash = await CryptoUtil.hashPassword(dto.password || defaultPassword);
    const user = this.userRepo.create({
      username: dto.username,
      passwordHash,
      realName: dto.realName,
      email: dto.email,
      phone: dto.phone,
      avatarUrl: dto.avatarUrl,
      orgId: dto.orgId,
      createdBy: createdBy,
      isFirstLogin: true,
      passwordExpireAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
    const savedUser = await this.userRepo.save(user);
    if (dto.roleIds && dto.roleIds.length > 0) {
      await this.assignRoles(savedUser.id, { roleIds: dto.roleIds });
    }
    return this.findById(savedUser.id);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (dto.username && dto.username !== user.username) {
      const existing = await this.userRepo.findOne({ where: { username: dto.username } });
      if (existing) {
        throw new ConflictException('Username already exists');
      }
    }
    if (dto.email && dto.email !== user.email) {
      const existingEmail = await this.userRepo.findOne({ where: { email: dto.email } });
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }
    if (dto.username) user.username = dto.username;
    if (dto.realName) user.realName = dto.realName;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl;
    if (dto.orgId !== undefined) user.orgId = dto.orgId;
    if (dto.password) {
      user.passwordHash = await CryptoUtil.hashPassword(dto.password);
      user.passwordExpireAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      user.isFirstLogin = false;
    }
    await this.userRepo.save(user);
    if (dto.roleIds) {
      await this.assignRoles(id, { roleIds: dto.roleIds });
    }
    return this.findById(id);
  }

  async remove(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.status = 0;
    await this.userRepo.save(user);
    await this.sessionRepo.update({ userId: id, isActive: true }, { isActive: false });
  }

  async updateStatus(id: string, status: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.status = status;
    await this.userRepo.save(user);
    if (status === 0) {
      await this.sessionRepo.update({ userId: id, isActive: true }, { isActive: false });
    }
  }

  async getUserRoles(id: string) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.roles || [];
  }

  async assignRoles(id: string, dto: { roleIds: string[] }) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (dto.roleIds.length > 0) {
      const roles = await this.roleRepo.findBy({ id: In(dto.roleIds) });
      if (roles.length !== dto.roleIds.length) {
        throw new NotFoundException('One or more roles not found');
      }
    }
    user.roles = dto.roleIds.length > 0 ? await this.roleRepo.findBy({ id: In(dto.roleIds) }) : [];
    await this.userRepo.save(user);
  }

  async resetPassword(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const defaultPassword = this.configService.get('security.defaultPassword', '123456');
    user.passwordHash = await CryptoUtil.hashPassword(defaultPassword);
    user.passwordExpireAt = null;
    user.isFirstLogin = true;
    user.loginFailCount = 0;
    user.lockedUntil = null;
    await this.userRepo.save(user);
    await this.sessionRepo.update({ userId: id, isActive: true }, { isActive: false });
    return defaultPassword;
  }

  async getUserSessions(id: string) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sessionRepo.find({
      where: { userId: id, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async forceLogoutSession(sessionId: string) {
    const session = await this.sessionRepo.findOne({ where: { sessionId } });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    session.isActive = false;
    await this.sessionRepo.save(session);
  }
}