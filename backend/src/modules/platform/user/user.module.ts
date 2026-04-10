import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from '../../../entities/platform/user.entity';
import { Role } from '../../../entities/platform/role.entity';
import { UserSession } from '../../../entities/platform/user-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, UserSession]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}