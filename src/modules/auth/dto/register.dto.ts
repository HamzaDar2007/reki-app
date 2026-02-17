import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../../common/enums/roles.enum';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ 
    enum: UserRole, 
    default: UserRole.USER,
    example: UserRole.USER,
    description: 'User role: USER (default), BUSINESS (venue owner), or ADMIN',
    required: false
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
