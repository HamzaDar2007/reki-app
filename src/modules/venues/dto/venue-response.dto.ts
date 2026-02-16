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
  galleryImages?: string[];
  logoUrl?: string;
  description?: string;
  isActive: boolean;

  // Live state information
  busyness: BusynessLevel;
  vibe: VibeType;
  busynessUpdatedAt: Date;
  vibeUpdatedAt: Date;

  // Additional computed fields
  activeOffersCount: number;
  distance?: number; // Distance in kilometers from search location

  createdAt: Date;
  updatedAt: Date;
}
