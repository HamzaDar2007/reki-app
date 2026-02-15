import { IsOptional, IsArray, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VenueCategory } from '../../venues/entities/venue.entity';
import { BusynessLevel, VibeType } from '../../venues/entities/venue-live-state.entity';

export class UpdatePreferencesDto {
  @ApiProperty({
    example: ['BAR', 'CLUB'],
    description: 'Preferred venue categories',
    enum: VenueCategory,
    isArray: true,
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCategories?: VenueCategory[];

  @ApiProperty({
    example: 'MODERATE',
    description: 'Minimum busyness level preference',
    enum: BusynessLevel,
    required: false
  })
  @IsOptional()
  @IsEnum(BusynessLevel)
  minBusyness?: BusynessLevel;

  @ApiProperty({
    example: ['SOCIAL', 'PARTY'],
    description: 'Preferred venue vibes',
    enum: VibeType,
    isArray: true,
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredVibes?: VibeType[];
}