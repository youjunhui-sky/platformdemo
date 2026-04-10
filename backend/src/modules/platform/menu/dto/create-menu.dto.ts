import { IsString, IsOptional, IsUUID, IsNotEmpty, MaxLength, IsInt, Min, IsBoolean } from 'class-validator';

export class CreateMenuDto {
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsUUID()
  @IsOptional()
  subsystemId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  code: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  path?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  component?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  redirect?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  icon?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  permission?: string;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsBoolean()
  @IsOptional()
  isCache?: boolean;

  @IsBoolean()
  @IsOptional()
  isFrame?: boolean;
}