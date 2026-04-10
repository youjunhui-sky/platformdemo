import { IsString, IsNotEmpty } from 'class-validator';

export class GenerateTicketDto {
  @IsString()
  @IsNotEmpty()
  subsystemCode: string;
}

export class ValidateTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  subsystemCode: string;
}