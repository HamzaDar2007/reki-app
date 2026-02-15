import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsBoolean, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
