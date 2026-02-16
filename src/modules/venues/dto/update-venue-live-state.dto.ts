import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BusynessLevel, VibeType } from '../entities/venue-live-state.entity';

export class UpdateVenueLiveStateDto {
  @ApiProperty({
    example: 'BUSY',
    description: 'Current busyness level of the venue',
    enum: BusynessLevel,
    required: false,
  })
  @IsOptional()
  @IsEnum(BusynessLevel)
  busyness?: BusynessLevel;

  @ApiProperty({
    example: 'PARTY',
    description: 'Current vibe of the venue',
    enum: VibeType,
    required: false,
  })
  @IsOptional()
  @IsEnum(VibeType)
  vibe?: VibeType;
}
