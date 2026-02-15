import {
  IsString,
  IsOptional,
  IsBoolean,
  Length,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCityDto {
  @ApiProperty({
    example: 'Manchester',
    description: 'City name'
  })
  @IsString()
  @Length(2, 120)
  name: string;

  @ApiProperty({
    example: 'GB',
    description: 'Two-letter country code (ISO 3166-1 alpha-2)'
  })
  @IsString()
  @Length(2, 2)
  countryCode: string;

  @ApiProperty({
    example: 'Europe/London',
    description: 'Timezone identifier',
    required: false
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the city is active',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: 53.480759,
    description: 'City center latitude',
    required: false
  })
  @IsOptional()
  @IsLatitude()
  centerLat?: number;

  @ApiProperty({
    example: -2.242631,
    description: 'City center longitude',
    required: false
  })
  @IsOptional()
  @IsLongitude()
  centerLng?: number;
}
