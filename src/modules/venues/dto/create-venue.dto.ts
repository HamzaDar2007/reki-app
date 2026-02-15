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
import { ApiProperty } from '@nestjs/swagger';
import { VenueCategory } from '../entities/venue.entity';

export class CreateVenueDto {
  @ApiProperty({
    example: '3ff5e526-7819-45d5-9995-bd6db919c9b2',
    description: 'City ID where the venue is located'
  })
  @IsUUID()
  cityId: string;

  @ApiProperty({
    example: 'The Rooftop Bar',
    description: 'Venue name'
  })
  @IsString()
  @Length(2, 160)
  name: string;

  @ApiProperty({
    example: 'BAR',
    description: 'Venue category',
    enum: VenueCategory
  })
  @IsEnum(VenueCategory)
  category: VenueCategory;

  @ApiProperty({
    example: '123 High Street, Manchester',
    description: 'Venue address',
    required: false
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  address?: string;

  @ApiProperty({
    example: 'M1 1AA',
    description: 'Venue postcode',
    required: false
  })
  @IsOptional()
  @IsString()
  @Length(1, 32)
  postcode?: string;

  @ApiProperty({
    example: 53.4808,
    description: 'Venue latitude',
    required: false
  })
  @IsOptional()
  @IsLatitude()
  lat?: number;

  @ApiProperty({
    example: -2.2426,
    description: 'Venue longitude',
    required: false
  })
  @IsOptional()
  @IsLongitude()
  lng?: number;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: 'Venue cover image URL',
    required: false
  })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiProperty({
    example: 'A trendy rooftop bar with amazing city views',
    description: 'Venue description',
    required: false
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: true,
    description: 'Whether the venue is active',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
