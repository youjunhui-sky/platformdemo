import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { Organization } from '../../../entities/platform/organization.entity';
import { User } from '../../../entities/platform/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, User]),
  ],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}