import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class MenuPermissionDto {
  @IsUUID()
  menuId: string;

  @IsString()
  @IsOptional()
  permissionType?: string;
}

export class AssignMenusDto {
  @IsArray()
  @Type(() => String)
  @IsUUID('4', { each: true })
  @IsOptional()
  menuIds?: string[];
}

export class AssignSubsystemsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  subsystemIds: string[];
}