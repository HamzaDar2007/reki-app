import {
  IsString,
  IsOptional,
  IsBoolean,
  Length,
  IsLatitude,
  IsLongitude,
} from 'class-validator';

export class CreateCityDto {
  @IsString()
  @Length(2, 120)
  name: string;

  @IsString()
  @Length(2, 2)
  countryCode: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsLatitude()
  centerLat?: number;

  @IsOptional()
  @IsLongitude()
  centerLng?: number;
}
