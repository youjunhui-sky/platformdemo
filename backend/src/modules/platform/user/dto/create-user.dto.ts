import { IsString, IsOptional, IsNotEmpty, MaxLength, MinLength, IsEmail, IsUUID, Matches } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  realName: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  @Matches(/^1[3-9]\d{9}$/, { message: 'Invalid Chinese mobile number' })
  phone?: string;

  @IsUUID()
  @IsOptional()
  orgId?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsUUID('4', { each: true })
  @IsOptional()
  roleIds?: string[];
}