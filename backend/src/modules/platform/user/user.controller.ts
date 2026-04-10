import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateUserDto, @CurrentUser('sub') currentUserId: string) {
    return this.userService.create(dto, currentUserId);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.userService.remove(id);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: number) {
    await this.userService.updateStatus(id, status);
    return { message: 'Status updated successfully' };
  }

  @Get(':id/roles')
  async getUserRoles(@Param('id') id: string) {
    return this.userService.getUserRoles(id);
  }

  @Put(':id/roles')
  async assignRoles(@Param('id') id: string, @Body() dto: AssignRolesDto) {
    await this.userService.assignRoles(id, dto);
    return { message: 'Roles assigned successfully' };
  }

  @Put(':id/reset-password')
  async resetPassword(@Param('id') id: string) {
    const newPassword = await this.userService.resetPassword(id);
    return { message: 'Password reset successfully', password: newPassword };
  }

  @Get(':id/sessions')
  async getUserSessions(@Param('id') id: string) {
    return this.userService.getUserSessions(id);
  }

  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forceLogoutSession(@Param('sessionId') sessionId: string) {
    await this.userService.forceLogoutSession(sessionId);
  }
}