import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../../../entities/platform/role.entity';
import { Menu } from '../../../entities/platform/menu.entity';
import { Subsystem } from '../../../entities/platform/subsystem.entity';
import { RoleMenu } from '../../../entities/platform/role-menu.entity';
import { RoleSubsystem } from '../../../entities/platform/role-subsystem.entity';
import { DataPermissionRule } from '../../../entities/platform/data-permission-rule.entity';
import { User } from '../../../entities/platform/user.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,
    @InjectRepository(Subsystem)
    private readonly subsystemRepo: Repository<Subsystem>,
    @InjectRepository(RoleMenu)
    private readonly roleMenuRepo: Repository<RoleMenu>,
    @InjectRepository(RoleSubsystem)
    private readonly roleSubsystemRepo: Repository<RoleSubsystem>,
    @InjectRepository(DataPermissionRule)
    private readonly dataRuleRepo: Repository<DataPermissionRule>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll(page = 1, pageSize = 10, keyword?: string, status?: number) {
    const queryBuilder = this.roleRepo.createQueryBuilder('role');
    if (keyword) {
      queryBuilder.andWhere('(role.name LIKE :keyword OR role.code LIKE :keyword)', { keyword: `%${keyword}%` });
    }
    if (status !== undefined) {
      queryBuilder.andWhere('role.status = :status', { status });
    }
    const [data, total] = await queryBuilder
      .orderBy('role.level', 'ASC')
      .addOrderBy('role.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();
    return { data, total };
  }

  async findById(id: string) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.roleRepo.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new ConflictException('Role code already exists');
    }
    const role = this.roleRepo.create({
      name: dto.name,
      code: dto.code,
      level: dto.level || 5,
      description: dto.description,
      dataScope: dto.dataScope || 4,
      isSystem: dto.isSystem || false,
    });
    return this.roleRepo.save(role);
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system role');
    }
    if (dto.code && dto.code !== role.code) {
      const existing = await this.roleRepo.findOne({ where: { code: dto.code } });
      if (existing) {
        throw new ConflictException('Role code already exists');
      }
    }
    Object.assign(role, dto);
    return this.roleRepo.save(role);
  }

  async remove(id: string) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system role');
    }
    const userCount = await this.userRepo.count({ where: { roles: { id } } });
    if (userCount > 0) {
      throw new BadRequestException('Cannot delete role with assigned users');
    }
    await this.roleRepo.remove(role);
  }

  async getRoleMenus(id: string) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    const roleMenus = await this.roleMenuRepo.find({ where: { roleId: id } });
    if (roleMenus.length === 0) {
      return [];
    }
    const menuIds = roleMenus.map((rm) => rm.menuId);
    const menus = await this.menuRepo.find({ where: { id: In(menuIds) } });
    return menus;
  }

  async assignMenus(id: string, dto: { menuIds?: string[] }) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    await this.roleMenuRepo.delete({ roleId: id });
    if (!dto.menuIds || dto.menuIds.length === 0) {
      return;
    }
    const menuIds = dto.menuIds;
    const menus = await this.menuRepo.findBy({ id: In(menuIds) });
    if (menus.length !== menuIds.length) {
      throw new NotFoundException('One or more menus not found');
    }
    const roleMenus = menuIds.map((menuId) =>
      this.roleMenuRepo.create({
        roleId: id,
        menuId,
        permissionType: 'visible',
      }),
    );
    await this.roleMenuRepo.save(roleMenus);
  }

  async getRoleUsers(id: string) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    const userRoles = await this.userRepo
      .createQueryBuilder('user')
      .innerJoin('user.roles', 'role')
      .where('role.id = :roleId', { roleId: id })
      .getMany();
    return userRoles;
  }

  async getRoleSubsystems(id: string) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    const result = await this.roleSubsystemRepo.query(
      `SELECT rs.subsystem_id as id FROM base.sys_role_subsystem rs WHERE rs.role_id = $1`,
      [id],
    );
    return result;
  }

  async assignSubsystems(id: string, dto: { subsystemIds: string[] }) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    await this.roleSubsystemRepo.delete({ roleId: id });
    if (dto.subsystemIds.length > 0) {
      const subsystems = await this.subsystemRepo.findBy({ id: In(dto.subsystemIds) });
      if (subsystems.length !== dto.subsystemIds.length) {
        throw new NotFoundException('One or more subsystems not found');
      }
      const roleSubsystems = dto.subsystemIds.map((subsystemId) =>
        this.roleSubsystemRepo.create({
          roleId: id,
          subsystemId,
          grantedAt: new Date(),
        }),
      );
      await this.roleSubsystemRepo.save(roleSubsystems);
    }
  }

  async getDataPermissions(id: string) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    const result = await this.dataRuleRepo.query(
      `SELECT scope_type, dept_ids FROM base.sys_data_permission_rule WHERE role_id = $1`,
      [id],
    );
    if (result.length === 0) {
      return { scopeType: 'all', deptIds: [] };
    }
    return {
      scopeType: result[0].scope_type || 'all',
      deptIds: result[0].dept_ids ? result[0].dept_ids.split(',') : [],
    };
  }

  async assignDataPermissions(id: string, data: { scopeType?: string; deptIds?: string[] }) {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    await this.dataRuleRepo.query(`DELETE FROM base.sys_data_permission_rule WHERE role_id = $1`, [id]);
    const scopeType = data.scopeType || 'all';
    const deptIds = data.deptIds ? data.deptIds.join(',') : '';
    await this.dataRuleRepo.query(
      `INSERT INTO base.sys_data_permission_rule (id, role_id, scope_type, dept_ids)
       VALUES (uuid_generate_v4(), $1, $2, $3)`,
      [id, scopeType, deptIds],
    );
  }
}