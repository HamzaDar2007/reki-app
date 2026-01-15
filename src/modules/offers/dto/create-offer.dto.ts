import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  Length,
  IsBoolean,
} from 'class-validator';
import { OfferType } from '../entities/offer.entity';
import { BusynessLevel } from '../../venues/entities/venue-live-state.entity';

export class CreateOfferDto {
  @IsUUID()
  venueId: string;

  @IsString()
  @Length(1, 160)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(OfferType)
  offerType: OfferType;

  @IsOptional()
  @IsEnum(BusynessLevel)
  minBusyness?: BusynessLevel;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
