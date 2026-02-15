import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOfferStatusDto {
  @ApiProperty({
    example: true,
    description: 'Whether the offer is active and visible to users',
  })
  @IsBoolean()
  isActive: boolean;
}
