import { IsString, IsOptional, IsNotEmpty, MaxLength, IsBoolean, IsInt } from 'class-validator';

export class RegisterSubsystemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  domain?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  logoUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsString()
  @IsOptional()
  authType?: string;

  @IsBoolean()
  @IsOptional()
  ssoEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  autoLogoutSync?: boolean;

  @IsString()
  @IsOptional()
  menuSyncUrl?: string;

  @IsString()
  @IsOptional()
  callbackUrl?: string;

  @IsString()
  @IsOptional()
  healthCheckUrl?: string;

  @IsInt()
  @IsOptional()
  healthCheckInterval?: number;
}

export class UpdateSubsystemDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  domain?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  authType?: string;

  @IsBoolean()
  @IsOptional()
  ssoEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  autoLogoutSync?: boolean;

  @IsString()
  @IsOptional()
  menuSyncUrl?: string;

  @IsString()
  @IsOptional()
  callbackUrl?: string;

  @IsString()
  @IsOptional()
  healthCheckUrl?: string;

  @IsInt()
  @IsOptional()
  healthCheckInterval?: number;
}