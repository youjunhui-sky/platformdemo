import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LisController } from './lis.controller';
import { LisService } from './lis.service';
import { LabTask } from '../../../entities/subsystems/lis/lab-task.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LabTask]),
  ],
  controllers: [LisController],
  providers: [LisService],
  exports: [LisService],
})
export class LisModule {}