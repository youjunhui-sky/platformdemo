import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PacsController } from './pacs.controller';
import { PacsService } from './pacs.service';
import { ImagingStudy } from '../../../entities/subsystems/pacs/imaging-study.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImagingStudy]),
  ],
  controllers: [PacsController],
  providers: [PacsService],
  exports: [PacsService],
})
export class PacsModule {}