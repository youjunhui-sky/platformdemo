import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { HisService } from './his.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('api/v1/subsystems/his')
export class HisController {
  constructor(private readonly hisService: HisService) {}

  @Get('patients')
  async findAllPatients(@Query() query: any) {
    return this.hisService.findAllPatients(query);
  }

  @Get('patients/:id')
  async findPatientById(@Param('id') id: string) {
    return this.hisService.findPatientById(id);
  }

  @Post('patients')
  async createPatient(@Body() dto: any, @CurrentUser('sub') createdBy: string) {
    return this.hisService.createPatient(dto, createdBy);
  }

  @Put('patients/:id')
  async updatePatient(@Param('id') id: string, @Body() dto: any) {
    return this.hisService.updatePatient(id, dto);
  }

  @Get('outpatients')
  async findAllOutpatients(@Query() query: any) {
    return this.hisService.findAllOutpatients(query);
  }

  @Post('outpatients')
  async createOutpatient(@Body() dto: any, @CurrentUser('sub') createdBy: string) {
    return this.hisService.createOutpatient(dto, createdBy);
  }

  @Get('inpatients')
  async findAllInpatients(@Query() query: any) {
    return this.hisService.findAllInpatients(query);
  }

  @Get('stats')
  async getStats() {
    return this.hisService.getStats();
  }
}