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
import { ApiProperty } from '@nestjs/swagger';
import { VibeType } from '../entities/venue-live-state.entity';

export class CreateVibeScheduleDto {
  @ApiProperty({
    example: 5,
    description: 'Day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)'
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday

  @ApiProperty({
    example: '19:00',
    description: 'Start time in HH:mm format'
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string; // HH:mm format

  @ApiProperty({
    example: '22:00',
    description: 'End time in HH:mm format'
  })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime: string; // HH:mm format

  @ApiProperty({
    example: 'PARTY',
    description: 'Vibe type for this time slot',
    enum: VibeType
  })
  @IsEnum(VibeType)
  vibe: VibeType;

  @ApiProperty({
    example: 1,
    description: 'Priority level (higher number = higher priority)',
    required: false
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiProperty({
    example: true,
    description: 'Whether this schedule is active',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
