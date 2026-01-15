import { VenueCategory } from '../entities/venue.entity';
import { BusynessLevel, VibeType } from '../entities/venue-live-state.entity';

export class VenueResponseDto {
  id: string;
  name: string;
  category: VenueCategory;
  address?: string;
  postcode?: string;
  lat?: number;
  lng?: number;
  coverImageUrl?: string;
  description?: string;
  isActive: boolean;

  // Live state information
  busyness: BusynessLevel;
  vibe: VibeType;
  busynessUpdatedAt: Date;
  vibeUpdatedAt: Date;

  // Additional computed fields
  activeOffersCount: number;

  createdAt: Date;
  updatedAt: Date;
}
