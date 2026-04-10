import { Controller, Get, Post, Put, Delete, Param, Query, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';

@Controller('menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get()
  async findAll(@Query('subsystemCode') subsystemCode?: string) {
    return this.menuService.findAll(subsystemCode);
  }

  @Get('tree')
  async findTree(@Query('subsystemCode') subsystemCode?: string) {
    return this.menuService.findTree(subsystemCode);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.menuService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateMenuDto) {
    return this.menuService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateMenuDto) {
    return this.menuService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.menuService.remove(id);
  }

  @Post('init-organization')
  @HttpCode(HttpStatus.OK)
  async initOrganizationMenu() {
    await this.menuService.initOrganizationMenu();
    return { message: 'Organization menu initialized' };
  }
}