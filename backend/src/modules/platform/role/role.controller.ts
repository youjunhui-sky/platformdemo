import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignMenusDto, AssignSubsystemsDto } from './dto/assign-menus.dto';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('keyword') keyword?: string,
    @Query('status') status?: string,
  ) {
    return this.roleService.findAll(
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 10,
      keyword,
      status ? Number(status) : undefined,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.roleService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.roleService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.roleService.remove(id);
  }

  @Get(':id/menus')
  async getRoleMenus(@Param('id') id: string) {
    return this.roleService.getRoleMenus(id);
  }

  @Put(':id/menus')
  async assignMenus(@Param('id') id: string, @Body() dto: AssignMenusDto) {
    await this.roleService.assignMenus(id, dto);
    return { message: 'Menus assigned successfully' };
  }

  @Get(':id/users')
  async getRoleUsers(@Param('id') id: string) {
    return this.roleService.getRoleUsers(id);
  }

  @Get(':id/subsystems')
  async getRoleSubsystems(@Param('id') id: string) {
    return this.roleService.getRoleSubsystems(id);
  }

  @Put(':id/subsystems')
  async assignSubsystems(@Param('id') id: string, @Body() dto: AssignSubsystemsDto) {
    await this.roleService.assignSubsystems(id, dto);
    return { message: 'Subsystems assigned successfully' };
  }

  @Get(':id/data-permissions')
  async getDataPermissions(@Param('id') id: string) {
    return this.roleService.getDataPermissions(id);
  }

  @Put(':id/data-permissions')
  async assignDataPermissions(
    @Param('id') id: string,
    @Body() data: { scopeType?: string; deptIds?: string[] },
  ) {
    await this.roleService.assignDataPermissions(id, data);
    return { message: 'Data permissions updated successfully' };
  }
}