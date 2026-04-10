import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Organization } from '../../../entities/platform/organization.entity';
import { User } from '../../../entities/platform/user.entity';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findAll() {
    return this.orgRepo.find({
      order: { level: 'ASC', sortOrder: 'ASC' },
    });
  }

  async findTree() {
    const orgs = await this.findAll();
    return this.buildOrgTree(orgs);
  }

  async findById(id: string) {
    const org = await this.orgRepo.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async create(dto: CreateOrganizationDto) {
    const parentId = dto.parentId || null;
    const whereCondition: any = { code: dto.code };
    if (parentId) {
      whereCondition.parentId = parentId;
    } else {
      whereCondition.parentId = IsNull();
    }
    const existing = await this.orgRepo.findOne({ where: whereCondition });
    if (existing) {
      throw new ConflictException('该机构代码已在当前父机构下存在');
    }
    if (dto.parentId) {
      const parent = await this.orgRepo.findOne({ where: { id: dto.parentId } });
      if (!parent) {
        throw new NotFoundException('Parent organization not found');
      }
      dto.level = parent.level + 1;
    }
    const org = this.orgRepo.create({
      parentId: dto.parentId || null,
      name: dto.name,
      code: dto.code,
      level: dto.level || 1,
      sortOrder: dto.sortOrder || 0,
      type: dto.type || 'department',
      status: dto.status !== undefined ? dto.status : 1,
    });
    return this.orgRepo.save(org);
  }

  async update(id: string, dto: UpdateOrganizationDto) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    if (dto.code && dto.code !== org.code) {
      const parentId = dto.parentId !== undefined ? dto.parentId : org.parentId;
      const whereCondition: any = { code: dto.code };
      if (parentId) {
        whereCondition.parentId = parentId;
      } else {
        whereCondition.parentId = IsNull();
      }
      const existing = await this.orgRepo.findOne({ where: whereCondition });
      if (existing) {
        throw new ConflictException('该机构代码已在当前父机构下存在');
      }
    }
    Object.assign(org, dto);
    return this.orgRepo.save(org);
  }

  async remove(id: string) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    const childCount = await this.orgRepo.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new BadRequestException('Cannot delete organization with child organizations');
    }
    const userCount = await this.userRepo.count({ where: { orgId: id } });
    if (userCount > 0) {
      throw new BadRequestException('Cannot delete organization with assigned users');
    }
    await this.orgRepo.remove(org);
  }

  async getOrgUsers(id: string) {
    const org = await this.orgRepo.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return this.userRepo.find({
      where: { orgId: id },
      order: { createdAt: 'DESC' },
    });
  }

  buildOrgTree(orgs: Organization[]) {
    const orgMap = new Map();
    const roots = [];
    for (const org of orgs) {
      org.children = [];
      orgMap.set(org.id, org);
    }
    for (const org of orgs) {
      if (org.parentId && orgMap.has(org.parentId)) {
        orgMap.get(org.parentId).children.push(org);
      } else {
        roots.push(org);
      }
    }
    const sortChildren = (nodes: Organization[]) => {
      nodes.sort((a, b) => a.sortOrder - b.sortOrder);
      for (const node of nodes) {
        sortChildren(node.children);
      }
    };
    sortChildren(roots);
    return roots;
  }
}