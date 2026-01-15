import { IsOptional, IsArray, IsEnum, IsString } from 'class-validator';
import { VenueCategory } from '../../venues/entities/venue.entity';
import { BusynessLevel, VibeType } from '../../venues/entities/venue-live-state.entity';

export class UpdatePreferencesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCategories?: VenueCategory[];

  @IsOptional()
  @IsEnum(BusynessLevel)
  minBusyness?: BusynessLevel;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredVibes?: VibeType[];
}