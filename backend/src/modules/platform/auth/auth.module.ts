import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { User } from '../../../entities/platform/user.entity';
import { Role } from '../../../entities/platform/role.entity';
import { Subsystem } from '../../../entities/platform/subsystem.entity';
import { Menu } from '../../../entities/platform/menu.entity';
import { TokenBlacklist } from '../../../entities/platform/token-blacklist.entity';
import { UserSession } from '../../../entities/platform/user-session.entity';
import { RoleSubsystem } from '../../../entities/platform/role-subsystem.entity';
import { RoleMenu } from '../../../entities/platform/role-menu.entity';
import { UserRole } from '../../../entities/platform/user-role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Subsystem,
      Menu,
      TokenBlacklist,
      UserSession,
      RoleSubsystem,
      RoleMenu,
      UserRole,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret', 'fallback-secret'),
        signOptions: {},
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, CaptchaService],
  exports: [AuthService, JwtModule, CaptchaService],
})
export class AuthModule {}