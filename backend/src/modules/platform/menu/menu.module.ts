import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuController } from './menu.controller';
import { MenuService } from './menu.service';
import { Menu } from '../../../entities/platform/menu.entity';
import { Subsystem } from '../../../entities/platform/subsystem.entity';
import { RoleMenu } from '../../../entities/platform/role-menu.entity';
import { Role } from '../../../entities/platform/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Menu, Subsystem, RoleMenu, Role]),
  ],
  controllers: [MenuController],
  providers: [MenuService],
  exports: [MenuService],
})
export class MenuModule {}