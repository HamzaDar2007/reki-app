export class CityResponseDto {
  id: string;
  name: string;
  countryCode: string;
  timezone: string;
  isActive: boolean;
  centerLat?: number;
  centerLng?: number;
  createdAt: Date;
  updatedAt: Date;
}
