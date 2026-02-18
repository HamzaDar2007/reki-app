import { IsUUID, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemOfferDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID of the offer to redeem',
  })
  @IsUUID()
  offerId: string;

  @ApiProperty({
    example: 'user-id-here',
    description: 'ID of the user redeeming the offer',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiProperty({
    example: 'DEMO',
    description: 'Source of the redemption (DEMO, INVESTOR, INTERNAL, etc.)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  source?: string;
}
