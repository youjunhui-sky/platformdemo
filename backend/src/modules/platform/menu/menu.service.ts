import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Menu } from '../../../entities/platform/menu.entity';
import { Subsystem } from '../../../entities/platform/subsystem.entity';
import { RoleMenu } from '../../../entities/platform/role-menu.entity';
import { Role } from '../../../entities/platform/role.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,
    @InjectRepository(Subsystem)
    private readonly subsystemRepo: Repository<Subsystem>,
    @InjectRepository(RoleMenu)
    private readonly roleMenuRepo: Repository<RoleMenu>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  private async getSubsystemIdByCode(code: string): Promise<string | null> {
    if (!code) return null;
    const subsystem = await this.subsystemRepo.findOne({ where: { code } });
    return subsystem?.id || null;
  }

  async findAll(subsystemCode?: string) {
    const subsystemId = await this.getSubsystemIdByCode(subsystemCode || '');
    const queryBuilder = this.menuRepo.createQueryBuilder('menu');
    if (subsystemId) {
      queryBuilder.where('menu.subsystemId = :subsystemId', { subsystemId });
    } else {
      queryBuilder.where('menu.subsystemId IS NULL');
    }
    return queryBuilder.orderBy('menu.sortOrder', 'ASC').getMany();
  }

  async findTree(subsystemCode?: string) {
    const menus = await this.findAll(subsystemCode);
    return this.buildMenuTree(menus);
  }

  async findById(id: string) {
    const menu = await this.menuRepo.findOne({
      where: { id },
      relations: ['parent'],
    });
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }
    return menu;
  }

  async create(dto: CreateMenuDto) {
    const existing = await this.menuRepo.findOne({
      where: { subsystemId: dto.subsystemId || undefined, code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Menu code already exists in this subsystem');
    }
    if (dto.parentId) {
      const parent = await this.menuRepo.findOne({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException('Parent menu not found');
      }
    }
    const menu = this.menuRepo.create({
      parentId: dto.parentId || null,
      subsystemId: dto.subsystemId || null,
      name: dto.name,
      code: dto.code,
      path: dto.path,
      component: dto.component,
      redirect: dto.redirect,
      icon: dto.icon,
      sortOrder: dto.sortOrder || 0,
      type: dto.type || 'menu',
      permission: dto.permission,
      isVisible: dto.isVisible !== undefined ? dto.isVisible : true,
      isCache: dto.isCache || false,
      isFrame: dto.isFrame || false,
    });
    return this.menuRepo.save(menu);
  }

  async update(id: string, dto: UpdateMenuDto) {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }
    if (dto.code && dto.code !== menu.code) {
      const existing = await this.menuRepo.findOne({
        where: dto.subsystemId
          ? { subsystemId: dto.subsystemId, code: dto.code }
          : { subsystemId: menu.subsystemId || undefined, code: dto.code },
      });
      if (existing) {
        throw new ConflictException('Menu code already exists in this subsystem');
      }
    }
    if (dto.parentId === id) {
      throw new BadRequestException('Menu cannot be its own parent');
    }
    if (dto.parentId) {
      const parent = await this.menuRepo.findOne({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException('Parent menu not found');
      }
    }
    Object.assign(menu, dto);
    if (dto.parentId === undefined) {
      if (dto.parentId === null) {
        menu.parentId = null;
      }
    }
    return this.menuRepo.save(menu);
  }

  async remove(id: string) {
    const menu = await this.menuRepo.findOne({ where: { id } });
    if (!menu) {
      throw new NotFoundException('Menu not found');
    }
    const childCount = await this.menuRepo.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new BadRequestException('Cannot delete menu with child menus');
    }
    await this.menuRepo.remove(menu);
  }

  buildMenuTree(menus: Menu[]) {
    const menuMap = new Map();
    const roots = [];
    for (const menu of menus) {
      menuMap.set(menu.id, {
        id: menu.id,
        name: menu.name,
        code: menu.code,
        path: menu.path,
        component: menu.component,
        redirect: menu.redirect,
        icon: menu.icon,
        sortOrder: menu.sortOrder,
        type: menu.type,
        permission: menu.permission,
        isVisible: menu.isVisible,
        isCache: menu.isCache,
        isFrame: menu.isFrame,
        children: [],
      });
    }
    for (const menu of menus) {
      const node = menuMap.get(menu.id);
      if (menu.parentId && menuMap.has(menu.parentId)) {
        menuMap.get(menu.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    }
    const sortChildren = (nodes: any[]) => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder);
      for (const node of nodes) {
        sortChildren(node.children);
      }
    };
    sortChildren(roots);
    return roots;
  }

  async initOrganizationMenu() {
    let orgMenu = await this.menuRepo.findOne({
      where: { code: 'platform:organization' },
    });
    if (!orgMenu) {
      orgMenu = await this.menuRepo.save({
        name: '机构管理',
        code: 'platform:organization',
        path: '/system-management/organization',
        component: 'system-management/organization/index',
        type: 'menu',
        sortOrder: 5,
        isVisible: true,
        icon: 'office',
      });
    }
    const buttons = [
      { name: '新增机构', code: 'platform:organization:create', permission: 'organization:create', sortOrder: 0 },
      { name: '编辑机构', code: 'platform:organization:update', permission: 'organization:update', sortOrder: 1 },
      { name: '删除机构', code: 'platform:organization:delete', permission: 'organization:delete', sortOrder: 2 },
    ];
    for (const btn of buttons) {
      const existing = await this.menuRepo.findOne({ where: { code: btn.code } });
      if (existing) continue;
      const menu = await this.menuRepo.save({
        parentId: orgMenu.id,
        name: btn.name,
        code: btn.code,
        type: 'button',
        permission: btn.permission,
        sortOrder: btn.sortOrder,
        isVisible: true,
      });
    }
    const adminRole = await this.roleRepo.findOne({
      where: { code: 'admin' },
    });
    let targetRoleId: string;
    if (!adminRole) {
      const roles = await this.roleRepo
        .createQueryBuilder('role')
        .where('role.name LIKE :name', { name: '%管理员%' })
        .take(1)
        .getMany();
      if (roles.length > 0) {
        targetRoleId = roles[0].id;
      } else {
        return;
      }
    } else {
      targetRoleId = adminRole.id;
    }
    const menus = await this.menuRepo.find({
      where: { code: In(['platform:organization', 'platform:organization:create', 'platform:organization:update', 'platform:organization:delete']) },
    });
    for (const menu of menus) {
      const existing = await this.roleMenuRepo.findOne({
        where: { roleId: targetRoleId, menuId: menu.id },
      });
      if (!existing) {
        await this.roleMenuRepo.save({
          roleId: targetRoleId,
          menuId: menu.id,
          permissionType: 'visible',
        });
      }
    }
  }
}