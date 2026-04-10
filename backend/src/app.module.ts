import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { databaseConfig } from './config/database.config';
import { jwtConfig, redisConfig, securityConfig } from './config/jwt.config';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

import { AuthModule } from './modules/platform/auth/auth.module';
import { AuditModule } from './modules/platform/audit/audit.module';
import { DictModule } from './modules/platform/dict/dict.module';
import { UserModule } from './modules/platform/user/user.module';
import { RoleModule } from './modules/platform/role/role.module';
import { MenuModule } from './modules/platform/menu/menu.module';
import { OrganizationModule } from './modules/platform/organization/organization.module';
import { SubsystemModule } from './modules/platform/subsystem/subsystem.module';
import { HisModule } from './modules/subsystems/his/his.module';
import { LisModule } from './modules/subsystems/lis/lis.module';
import { PacsModule } from './modules/subsystems/pacs/pacs.module';

import {
  User,
  Role,
  Subsystem,
  Menu,
  Organization,
  UserRole,
  RoleSubsystem,
  RoleMenu,
  DataPermissionRule,
  AuditLog,
  TokenBlacklist,
  UserSession,
  Patient,
  OutpatientRecord,
  InpatientRecord,
  LabTask,
  ImagingStudy,
  DictType,
  DictInfo,
} from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, redisConfig, securityConfig],
      envFilePath: ['.env'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host', 'localhost'),
        port: configService.get<number>('database.port', 5432),
        username: configService.get<string>('database.username', 'postgres'),
        password: configService.get<string>('database.password', 'postgres'),
        database: configService.get<string>('database.database', 'hospital_idp'),
        entities: [
          User,
          Role,
          Subsystem,
          Menu,
          Organization,
          UserRole,
          RoleSubsystem,
          RoleMenu,
          DataPermissionRule,
          AuditLog,
          TokenBlacklist,
          UserSession,
          Patient,
          OutpatientRecord,
          InpatientRecord,
          LabTask,
          ImagingStudy,
          DictType,
          DictInfo,
        ],
        synchronize: configService.get<boolean>('database.synchronize', false),
        logging: configService.get<boolean>('database.logging', false),
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),

    TypeOrmModule.forFeature([AuditLog, TokenBlacklist, UserSession, Patient, OutpatientRecord, InpatientRecord, LabTask, ImagingStudy, DictType, DictInfo]),

    AuthModule,
    DictModule,
    UserModule,
    RoleModule,
    MenuModule,
    SubsystemModule,
    AuditModule,
    OrganizationModule,
    HisModule,
    LisModule,
    PacsModule,
  ],

  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],

  controllers: [],

  exports: [TypeOrmModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}