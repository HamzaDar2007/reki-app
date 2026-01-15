import { OfferType } from '../entities/offer.entity';
import { BusynessLevel } from '../../venues/entities/venue-live-state.entity';

export class OfferResponseDto {
  id: string;
  title: string;
  description?: string;
  offerType: OfferType;
  minBusyness: BusynessLevel;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  viewCount: number;
  clickCount: number;
  redeemCount: number;
  createdAt: Date;
  updatedAt: Date;

  // Venue information
  venue: {
    id: string;
    name: string;
    category: string;
    address?: string;
  };
}
