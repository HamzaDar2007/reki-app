import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  IsUUID,
  IsLatitude,
  IsLongitude,
  IsBoolean,
} from 'class-validator';
import { VenueCategory } from '../entities/venue.entity';

export class CreateVenueDto {
  @IsUUID()
  cityId: string;

  @IsString()
  @Length(2, 160)
  name: string;

  @IsEnum(VenueCategory)
  category: VenueCategory;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  address?: string;

  @IsOptional()
  @IsString()
  @Length(1, 32)
  postcode?: string;

  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;

  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
