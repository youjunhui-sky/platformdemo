import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { SubsystemService } from './subsystem.service';
import { RegisterSubsystemDto, UpdateSubsystemDto } from './dto/register-subsystem.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('subsystems')
export class SubsystemController {
  constructor(private readonly subsystemService: SubsystemService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    return this.subsystemService.findAll(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 10,
      keyword,
      status ? Number(status) : undefined,
    );
  }

  @Get('accessible')
  async getAccessible(@CurrentUser('sub') userId: string) {
    return this.subsystemService.getAccessibleSubsystems(userId);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.subsystemService.findById(id);
  }

  @Post()
  async create(@Body() dto: RegisterSubsystemDto, @CurrentUser('sub') currentUserId: string) {
    return this.subsystemService.create(dto, currentUserId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateSubsystemDto) {
    return this.subsystemService.update(id, dto);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    await this.subsystemService.updateStatus(id, status);
    return { message: 'Status updated successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.subsystemService.remove(id);
  }

  @Post(':id/secret/rotate')
  async rotateSecret(@Param('id') id: string) {
    return this.subsystemService.rotateSecret(id);
  }

  @Get(':id/health')
  async healthCheck(@Param('id') id: string) {
    return this.subsystemService.healthCheck(id);
  }
}