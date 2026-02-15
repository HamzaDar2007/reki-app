import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123def456' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewPassword123!', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
