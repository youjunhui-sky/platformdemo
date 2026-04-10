import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { PacsService } from './pacs.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('api/v1/subsystems/pacs')
export class PacsController {
  constructor(private readonly pacsService: PacsService) {}

  @Get('studies')
  async findAllStudies(@Query() query: any) {
    return this.pacsService.findAllStudies(query);
  }

  @Get('studies/:id')
  async findStudyById(@Param('id') id: string) {
    return this.pacsService.findStudyById(id);
  }

  @Post('studies')
  async createStudy(@Body() dto: any, @CurrentUser('sub') createdBy: string) {
    return this.pacsService.createStudy(dto, createdBy);
  }

  @Put('studies/:id')
  async updateStudy(@Param('id') id: string, @Body() dto: any) {
    return this.pacsService.updateStudy(id, dto);
  }

  @Post('reports')
  async createReport(@Body() dto: any) {
    return this.pacsService.createStudy(dto, '');
  }

  @Post('reports/:id')
  async saveReport(
    @Param('id') id: string,
    @Body('findings') findings: string,
    @Body('impression') impression: string,
    @Body('radiologist') radiologist: string,
  ) {
    return this.pacsService.saveReport(id, findings, impression, radiologist);
  }

  @Get('stats')
  async getStats() {
    return this.pacsService.getStats();
  }
}