import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  Length,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OfferType } from '../entities/offer.entity';
import { BusynessLevel } from '../../venues/entities/venue-live-state.entity';

export class CreateOfferDto {
  @ApiProperty({
    example: 'd6cda10c-4c74-437f-99d4-5660e73c01ff',
    description: 'ID of the venue this offer belongs to'
  })
  @IsUUID()
  venueId: string;

  @ApiProperty({
    example: '50% Off All Cocktails',
    description: 'Offer title'
  })
  @IsString()
  @Length(1, 160)
  title: string;

  @ApiProperty({
    example: 'Get 50% off all cocktails during happy hour',
    description: 'Detailed offer description',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'PERCENT_OFF',
    description: 'Type of offer',
    enum: OfferType
  })
  @IsEnum(OfferType)
  offerType: OfferType;

  @ApiProperty({
    example: 'MODERATE',
    description: 'Minimum busyness level required for this offer to be available',
    enum: BusynessLevel,
    required: false
  })
  @IsOptional()
  @IsEnum(BusynessLevel)
  minBusyness?: BusynessLevel;

  @ApiProperty({
    example: '2024-02-14T17:00:00Z',
    description: 'When the offer starts (ISO 8601 format)'
  })
  @IsDateString()
  startsAt: string;

  @ApiProperty({
    example: '2024-02-21T23:59:59Z',
    description: 'When the offer ends (ISO 8601 format)'
  })
  @IsDateString()
  endsAt: string;

  @ApiProperty({
    example: true,
    description: 'Whether the offer is active',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
