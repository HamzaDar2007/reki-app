import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Offer } from './entities/offer.entity';
import { OfferRedemption } from './entities/offer-redemption.entity';
import {
  VenueLiveState,
  BusynessLevel,
} from '../venues/entities/venue-live-state.entity';
import { CreateOfferDto } from './dto/create-offer.dto';
import { RedeemOfferDto } from './dto/redeem-offer.dto';

@Injectable()
export class OffersService {
  // Busyness level ranking for correct comparison
  private readonly busynessRanking = {
    [BusynessLevel.QUIET]: 1,
    [BusynessLevel.MODERATE]: 2,
    [BusynessLevel.BUSY]: 3,
  };

  constructor(
    @InjectRepository(Offer)
    private readonly offerRepo: Repository<Offer>,
    @InjectRepository(OfferRedemption)
    private readonly redemptionRepo: Repository<OfferRedemption>,
    @InjectRepository(VenueLiveState)
    private readonly liveStateRepo: Repository<VenueLiveState>,
  ) {}

  async create(dto: CreateOfferDto): Promise<Offer> {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (startsAt >= endsAt) {
      throw new BadRequestException('Start date must be before end date');
    }

    const offer = this.offerRepo.create({
      ...dto,
      venue: { id: dto.venueId },
      startsAt,
      endsAt,
      minBusyness: dto.minBusyness ?? BusynessLevel.QUIET,
      isActive: dto.isActive ?? true,
    });

    return this.offerRepo.save(offer);
  }

  async findById(id: string): Promise<Offer> {
    const offer = await this.offerRepo.findOne({
      where: { id },
      relations: ['venue', 'venue.city'],
    });

    if (!offer) throw new NotFoundException('Offer not found');
    return offer;
  }

  async findByVenue(venueId: string): Promise<Offer[]> {
    return this.offerRepo.find({
      where: { venue: { id: venueId } },
      relations: ['venue'],
      order: { startsAt: 'DESC' },
    });
  }

  /**
   * FIXED: Correct busyness comparison using ranking
   */
  async getAvailableOffers(
    venueId: string,
    now: Date = new Date(),
  ): Promise<Offer[]> {
    const liveState = await this.liveStateRepo.findOne({
      where: { venue: { id: venueId } },
    });

    if (!liveState) return [];

    const currentBusynessRank = this.busynessRanking[liveState.busyness];

    const offers = await this.offerRepo.find({
      where: {
        venue: { id: venueId },
        isActive: true,
        startsAt: LessThanOrEqual(now),
        endsAt: MoreThanOrEqual(now),
      },
      relations: ['venue'],
      order: { startsAt: 'ASC' },
    });

    // Filter by busyness ranking (current >= required)
    return offers.filter((offer) => {
      const requiredBusynessRank = this.busynessRanking[offer.minBusyness];
      return currentBusynessRank >= requiredBusynessRank;
    });
  }

  async incrementViewCount(offerId: string): Promise<void> {
    await this.offerRepo.increment({ id: offerId }, 'viewCount', 1);
  }

  async incrementClickCount(offerId: string): Promise<void> {
    await this.offerRepo.increment({ id: offerId }, 'clickCount', 1);
  }

  async redeem(
    dto: RedeemOfferDto,
  ): Promise<{ success: boolean; message?: string }> {
    const offer = await this.offerRepo.findOne({
      where: { id: dto.offerId, isActive: true },
      relations: ['venue'],
    });

    if (!offer) {
      return { success: false, message: 'Offer not found or inactive' };
    }

    const now = new Date();
    if (now < offer.startsAt || now > offer.endsAt) {
      return { success: false, message: 'Offer is not currently available' };
    }

    // Check if venue meets busyness requirement
    const availableOffers = await this.getAvailableOffers(offer.venue.id, now);
    const isAvailable = availableOffers.some((o) => o.id === offer.id);

    if (!isAvailable) {
      return {
        success: false,
        message: 'Offer not available at current busyness level',
      };
    }

    // Create redemption record
    const redemption = this.redemptionRepo.create({
      offer,
      venue: offer.venue,
      source: dto.source ?? 'DEMO',
    });

    await this.redemptionRepo.save(redemption);

    // Increment redemption count
    await this.offerRepo.increment({ id: offer.id }, 'redeemCount', 1);

    return { success: true };
  }

  async getOfferStats(offerId: string): Promise<{
    views: number;
    clicks: number;
    redemptions: number;
    conversionRate: number;
  }> {
    const offer = await this.findById(offerId);

    const conversionRate =
      offer.viewCount > 0 ? (offer.redeemCount / offer.viewCount) * 100 : 0;

    return {
      views: offer.viewCount,
      clicks: offer.clickCount,
      redemptions: offer.redeemCount,
      conversionRate: Math.round(conversionRate * 100) / 100,
    };
  }

  async getActiveOffersCount(venueId: string): Promise<number> {
    const now = new Date();
    return this.offerRepo.count({
      where: {
        venue: { id: venueId },
        isActive: true,
        startsAt: LessThanOrEqual(now),
        endsAt: MoreThanOrEqual(now),
      },
    });
  }

  async updateStatus(id: string, isActive: boolean): Promise<Offer> {
    const offer = await this.findById(id);
    offer.isActive = isActive;
    return this.offerRepo.save(offer);
  }
}
