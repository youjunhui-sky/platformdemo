import { IsString, IsOptional, IsNotEmpty, MaxLength, IsInt, Min, Max, IsBoolean } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  level?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(1)
  @Max(4)
  @IsOptional()
  dataScope?: number;

  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;
}