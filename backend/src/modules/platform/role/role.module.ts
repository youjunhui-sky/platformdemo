import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { Role } from '../../../entities/platform/role.entity';
import { Menu } from '../../../entities/platform/menu.entity';
import { Subsystem } from '../../../entities/platform/subsystem.entity';
import { RoleMenu } from '../../../entities/platform/role-menu.entity';
import { RoleSubsystem } from '../../../entities/platform/role-subsystem.entity';
import { DataPermissionRule } from '../../../entities/platform/data-permission-rule.entity';
import { User } from '../../../entities/platform/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Role,
      Menu,
      Subsystem,
      RoleMenu,
      RoleSubsystem,
      DataPermissionRule,
      User,
    ]),
  ],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}