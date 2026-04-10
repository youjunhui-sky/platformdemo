import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { User } from '../../../entities/platform/user.entity';
import { Role } from '../../../entities/platform/role.entity';
import { Subsystem } from '../../../entities/platform/subsystem.entity';
import { Menu } from '../../../entities/platform/menu.entity';
import { TokenBlacklist } from '../../../entities/platform/token-blacklist.entity';
import { UserSession } from '../../../entities/platform/user-session.entity';
import { RoleSubsystem } from '../../../entities/platform/role-subsystem.entity';
import { RoleMenu } from '../../../entities/platform/role-menu.entity';
import { UserRole } from '../../../entities/platform/user-role.entity';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GenerateTicketDto } from './dto/sso.dto';
import { JwtPayload } from '../../../types';
import { CryptoUtil } from '../../../common/utils/crypto';

@Injectable()
export class AuthService {
  private redis: Redis;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Subsystem)
    private readonly subsystemRepository: Repository<Subsystem>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(TokenBlacklist)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklist>,
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
    @InjectRepository(RoleSubsystem)
    private readonly roleSubsystemRepository: Repository<RoleSubsystem>,
    @InjectRepository(RoleMenu)
    private readonly roleMenuRepository: Repository<RoleMenu>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.initRedis();
  }

  private async initRedis(): Promise<void> {
    const host = this.configService.get<string>('redis.host', 'localhost');
    const port = this.configService.get<number>('redis.port', 6379);
    this.redis = new Redis({ host, port });
  }

  async login(dto: LoginDto, ipAddress: string, userAgent: string) {
    const captchaValid = await this.validateCaptcha(dto.captchaId, dto.captchaAnswer);
    if (!captchaValid) {
      throw new Error('Invalid captcha code');
    }

    const user = await this.userRepository.findOne({
      where: { username: dto.username },
    });

    if (!user) {
      throw new Error('Invalid username or password');
    }

    const isPasswordValid = await this.verifyPassword(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    const payload: any = {
      sub: user.id,
      name: user.username,
      roleIds: [],
      dataScope: 5,
      subsystemCodes: [],
      deptId: null,
    };

    // Generate UUID for token identification
    const { v4: uuidv4 } = await import('uuid');
    const tokenJti = uuidv4();

    payload.jti = tokenJti;

    // Sign to get token first
    const accessToken = this.jwtService.sign(payload, { expiresIn: '2h' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.saveSession(user.id, accessToken, refreshToken, ipAddress, userAgent);

    const menus = await this.getUserMenus(user.id);
    const subsystems = await this.getUserSubsystems(user.id);

    // Extract all permissions from button-type menus (recursively from children)
    const extractPermissions = (items: any[]): string[] => {
      const permissions: string[] = [];
      const process = (list: any[]) => {
        for (const item of list) {
          if (item.type === 'button' && item.permission) {
            permissions.push(item.permission);
          }
          if (item.children && item.children.length > 0) {
            process(item.children);
          }
        }
      };
      process(items);
      return permissions;
    };
    const permissions = extractPermissions(menus);

    return {
      accessToken,
      refreshToken,
      expiresIn: 7200,
      user: {
        id: user.id,
        username: user.username,
        realName: user.realName,
      },
      menus,
      subsystems,
      permissions,
    };
  }

  private async validateCaptcha(captchaId: string, captchaAnswer: string): Promise<boolean> {
    const storedCode = await this.redis.get(captchaId);
    if (!storedCode) {
      return false;
    }
    await this.redis.del(captchaId);
    return storedCode.toUpperCase() === captchaAnswer.toUpperCase();
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return CryptoUtil.verifyPassword(password, hash);
  }

  async logout(token: string, userId: string): Promise<void> {
    // Decode token to get jti
    const decoded = this.jwtService.verify(token);
    const tokenJti = decoded.jti;
    const expiresAt = new Date();
    await this.tokenBlacklistRepository.save({
      tokenJti,
      userId,
      expiresAt,
    });
    await this.userSessionRepository.delete({ userId });
  }

  async refresh(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const payload: JwtPayload = {
        sub: decoded.sub,
        name: decoded.name || '',
        username: decoded.username || '',
        roleIds: decoded.roles || [],
        jti: decoded.jti || '',
        dataScope: decoded.dataScope || 5,
        subsystemCodes: [],
        deptId: null,
      };
      const newAccessToken = this.jwtService.sign(payload, { expiresIn: '2h' });
      const newRefreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 7200,
      };
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  async getUserInfo(userId: string) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    return {
      id: user.id,
      username: user.username,
      realName: user.realName,
      email: user.email,
      phone: user.phone,
    };
  }

  async getUserMenus(userId: string) {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
    });
    const roleIds = userRoles.map((ur) => ur.roleId);
    const roleMenus = await this.roleMenuRepository.find({
      where: { roleId: In(roleIds) },
    });
    const menuIds = [...new Set(roleMenus.map((rm) => rm.menuId))];
    // Get platform menus (subsystem_id is null) including buttons with parent relationship
    const menus = await this.menuRepository.find({
      where: { id: In(menuIds), status: 1, subsystemId: IsNull() },
      order: { sortOrder: 'ASC' },
    });
    // Build tree structure (includes both menu and button types)
    const menuMap = new Map<string, any>();
    const rootMenus: any[] = [];

    menus.forEach((menu) => {
      menuMap.set(menu.id, { ...menu, children: [] });
    });

    menus.forEach((menu) => {
      const menuWithChildren = menuMap.get(menu.id);
      if (menu.parentId) {
        const parent = menuMap.get(menu.parentId);
        if (parent) {
          parent.children.push(menuWithChildren);
        } else {
          rootMenus.push(menuWithChildren);
        }
      } else {
        rootMenus.push(menuWithChildren);
      }
    });

    return rootMenus;
  }

  private async getUserSubsystems(userId: string) {
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
    });
    const roleIds = userRoles.map((ur) => ur.roleId);
    const roleSubsystems = await this.roleSubsystemRepository.find({
      where: { roleId: In(roleIds) },
    });
    const subsystemIds = [...new Set(roleSubsystems.map((rs) => rs.subsystemId))];
    return this.subsystemRepository.find({
      where: { id: In(subsystemIds) },
    });
  }

  private async saveSession(
    userId: string,
    accessToken: string,
    refreshToken: string,
    ipAddress: string,
    userAgent: string,
  ) {
    const { v4: uuidv4 } = await import('uuid');
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 2);

    //打印出参数
    console.info("sessionId==" + sessionId);
    console.info("userId==" + userId);
    console.info("ipAddress==" + ipAddress);
    console.info("userAgent==" + userAgent);
    console.info("expiresAt==" + expiresAt);
    console.info("refreshToken==" + refreshToken);

    const decoded = this.jwtService.verify(refreshToken);
    const tokenJti = decoded.jti;


    await this.userSessionRepository.save({
      sessionId,
      refreshTokenJti: tokenJti,
      userId,
      ipAddress,
      userAgent,
      expiresAt,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    const isValid = await this.verifyPassword(dto.oldPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid old password');
    }
    await this.userRepository.update(userId, { passwordHash: dto.newPassword });
  }

  async generateSsoTicket(userId: string, dto: GenerateTicketDto) {
    const payload = { userId, subsystemCode: dto.subsystemCode };
    const ticket = this.jwtService.sign(payload, { expiresIn: '5m' });
    return ticket;
  }

  async exchangeTicket(ticket: string) {
    const decoded = this.jwtService.verify(ticket);
    const { userId, subsystemCode } = decoded as any;
    const menus = await this.getUserMenuTree(userId, subsystemCode);
    const payload: JwtPayload = {
      sub: userId,
      name: '',
      username: '',
      roleIds: [],
      jti: '',
      dataScope: 5,
      subsystemCodes: [],
      deptId: null,
    };
    const token = this.jwtService.sign(payload, { expiresIn: '2h' });
    return { token, menus };
  }

  async getUserMenuTree(userId: string, subsystemCode: string) {
    return [];
  }

  async validateSubsystemToken(token: string, subsystemCode: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new Error('Invalid token');
    }
  }

  async forceLogout(userId: string, targetUserId: string) {
    await this.userSessionRepository.delete({ userId: targetUserId });
  }
}