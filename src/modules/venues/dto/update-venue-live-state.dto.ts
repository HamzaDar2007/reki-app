import { IsEnum, IsOptional } from 'class-validator';
import { BusynessLevel, VibeType } from '../entities/venue-live-state.entity';

export class UpdateVenueLiveStateDto {
  @IsOptional()
  @IsEnum(BusynessLevel)
  busyness?: BusynessLevel;

  @IsOptional()
  @IsEnum(VibeType)
  vibe?: VibeType;
}
