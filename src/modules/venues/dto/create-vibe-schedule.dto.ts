import {
  IsEnum,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsString,
  Matches,
  IsOptional,
} from 'class-validator';
import { VibeType } from '../entities/venue-live-state.entity';

export class CreateVibeScheduleDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string; // HH:mm format

  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime: string; // HH:mm format

  @IsEnum(VibeType)
  vibe: VibeType;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
