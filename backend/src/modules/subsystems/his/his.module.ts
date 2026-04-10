import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HisController } from './his.controller';
import { HisService } from './his.service';
import { Patient } from '../../../entities/subsystems/his/patient.entity';
import { OutpatientRecord } from '../../../entities/subsystems/his/outpatient-record.entity';
import { InpatientRecord } from '../../../entities/subsystems/his/inpatient-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, OutpatientRecord, InpatientRecord]),
  ],
  controllers: [HisController],
  providers: [HisService],
  exports: [HisService],
})
export class HisModule {}