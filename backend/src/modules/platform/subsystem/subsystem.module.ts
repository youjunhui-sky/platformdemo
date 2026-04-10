import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubsystemController } from './subsystem.controller';
import { SubsystemService } from './subsystem.service';
import { Subsystem } from '../../../entities/platform/subsystem.entity';
import { Role } from '../../../entities/platform/role.entity';
import { UserRole } from '../../../entities/platform/user-role.entity';
import { RoleSubsystem } from '../../../entities/platform/role-subsystem.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Subsystem, Role, UserRole, RoleSubsystem]),
  ],
  controllers: [SubsystemController],
  providers: [SubsystemService],
  exports: [SubsystemService],
})
export class SubsystemModule {}