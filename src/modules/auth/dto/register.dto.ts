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
    example: 'Husnain Ahmed',
    description: 'User full name',
  })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({
    example: '+447900123456',
    description: 'User phone number',
  })
  @IsString()
  @MinLength(7)
  phone: string;

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
