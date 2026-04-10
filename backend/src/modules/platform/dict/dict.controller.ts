import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';
import { DictService } from './dict.service';

class CreateDictTypeDto {
  @IsString()
  name: string;

  @IsString()
  key: string;
}

class UpdateDictTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  key?: string;
}

class CreateDictInfoDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsUUID()
  typeId: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsNumber()
  orderNum?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

class UpdateDictInfoDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;

  @IsOptional()
  @IsNumber()
  orderNum?: number;

  @IsOptional()
  @IsString()
  remark?: string;
}

@Controller('dict')
export class DictController {
  constructor(private readonly dictService: DictService) {}

  @Post('type')
  async createType(@Body() dto: CreateDictTypeDto) {
    return this.dictService.createType(dto);
  }

  @Put('type/:id')
  async updateType(@Param('id') id: string, @Body() dto: UpdateDictTypeDto) {
    return this.dictService.updateType(id, dto);
  }

  @Delete('type/:id')
  async deleteType(@Param('id') id: string) {
    await this.dictService.deleteType(id);
    return { message: 'Dictionary type deleted successfully' };
  }

  @Get('type')
  async findAllTypes() {
    return this.dictService.findAllTypes();
  }

  @Get('type/:id')
  async findTypeById(@Param('id') id: string) {
    return this.dictService.findTypeById(id);
  }

  @Post('info')
  async createDictInfo(@Body() dto: CreateDictInfoDto) {
    return this.dictService.createDictInfo(dto);
  }

  @Put('info/:id')
  async updateDictInfo(@Param('id') id: string, @Body() dto: UpdateDictInfoDto) {
    return this.dictService.updateDictInfo(id, dto);
  }

  @Delete('info/:id')
  async deleteDictInfo(@Param('id') id: string) {
    await this.dictService.deleteDictInfo(id);
    return { message: 'Dictionary info deleted successfully' };
  }

  @Get('info')
  async findAllDictInfos() {
    return this.dictService.findAllDictInfos();
  }

  @Get('info/type/:typeId')
  async findDictInfosByType(@Param('typeId') typeId: string) {
    return this.dictService.findDictInfosByType(typeId);
  }

  @Get('data')
  async getDictData(@Query('types') types?: string) {
    const typeList = types ? types.split(',') : undefined;
    return this.dictService.getDictData(typeList);
  }

  @Get('types')
  async getDictTypes() {
    return this.dictService.getDictTypes();
  }

  @Post('getName')
  async getDictName(@Body('id') id: string) {
    return this.dictService.getDictName(id);
  }
}