import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/create-organization.dto';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get()
  async findAll(@Query('flat') flat?: string) {
    if (flat === 'true') {
      return this.organizationService.findAll();
    }
    return this.organizationService.findTree();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.organizationService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateOrganizationDto) {
    return this.organizationService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto) {
    return this.organizationService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.organizationService.remove(id);
  }

  @Get(':id/users')
  async getOrgUsers(@Param('id') id: string) {
    return this.organizationService.getOrgUsers(id);
  }
}