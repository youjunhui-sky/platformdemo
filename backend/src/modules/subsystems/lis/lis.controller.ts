import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { LisService } from './lis.service';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('api/v1/subsystems/lis')
export class LisController {
  constructor(private readonly lisService: LisService) {}

  @Get('tasks')
  async findAllTasks(@Query() query: any) {
    return this.lisService.findAllTasks(query);
  }

  @Get('tasks/:id')
  async findTaskById(@Param('id') id: string) {
    return this.lisService.findTaskById(id);
  }

  @Post('tasks')
  async createTask(@Body() dto: any, @CurrentUser('sub') createdBy: string) {
    return this.lisService.createTask(dto, createdBy);
  }

  @Put('tasks/:id')
  async updateTask(@Param('id') id: string, @Body() dto: any) {
    return this.lisService.updateTask(id, dto);
  }

  @Post('results')
  async createResult(@Body() dto: any) {
    return this.lisService.createTask(dto, '');
  }

  @Post('results/:id')
  async saveResult(
    @Param('id') id: string,
    @Body('result') result: string,
    @Body('labUser') labUser: string,
  ) {
    return this.lisService.saveResult(id, result, labUser);
  }

  @Get('stats')
  async getStats() {
    return this.lisService.getStats();
  }
}