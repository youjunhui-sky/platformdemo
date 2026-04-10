import { IsString, IsOptional, IsUUID, IsNotEmpty, MaxLength, IsNumber, Min, IsInt, Max, IsEnum } from 'class-validator';

export class CreateOrganizationDto {
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsNumber()
  @IsOptional()
  level?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsEnum(['hospital', 'department', 'ward', 'group'])
  @IsOptional()
  type?: string;

  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  status?: number;
}

export class UpdateOrganizationDto {
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  sortOrder?: number;

  @IsEnum(['hospital', 'department', 'ward', 'group'])
  @IsOptional()
  type?: string;

  @IsInt()
  @Min(0)
  @Max(1)
  @IsOptional()
  status?: number;
}