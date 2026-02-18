import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venue } from './entities/venue.entity';
import { VenueLiveState } from './entities/venue-live-state.entity';
import { CreateVenueDto } from './dto/create-venue.dto';
import { City } from '../cities/entities/city.entity';

@Injectable()
export class VenuesService {
  private readonly logger = new Logger(VenuesService.name);

  constructor(
    @InjectRepository(Venue)
    private readonly venueRepo: Repository<Venue>,
    @InjectRepository(VenueLiveState)
    private readonly liveStateRepo: Repository<VenueLiveState>,
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
  ) {}

  async create(dto: CreateVenueDto, ownerId?: string): Promise<Venue> {
    try {
      // Validate that the city exists
      const city = await this.cityRepo.findOne({
        where: { id: dto.cityId, isActive: true },
      });

      if (!city) {
        throw new BadRequestException(
          `City with ID "${dto.cityId}" does not exist or is inactive`,
        );
      }

      const venue = this.venueRepo.create({
        ...dto,
        city: { id: dto.cityId },
        owner: ownerId ? { id: ownerId } : undefined,
      });

      const savedVenue = await this.venueRepo.save(venue);

      // Create initial live state
      const liveState = this.liveStateRepo.create({
        venue: savedVenue,
      });
      await this.liveStateRepo.save(liveState);

      this.logger.log(`Venue created: ${savedVenue.name} in city ${city.name}`);
      return savedVenue;
    } catch (error) {
      if ((error as any).status === 400) {
        throw error;
      }
      this.logger.error(`Failed to create venue: ${error.message}`);
      throw error;
    }
  }

  async findByCity(cityId: string): Promise<Venue[]> {
    return this.venueRepo.find({
      where: {
        city: { id: cityId },
        isActive: true,
      },
      relations: ['liveState', 'city', 'offers'],
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Venue> {
    const venue = await this.venueRepo.findOne({
      where: { id, isActive: true },
      relations: ['liveState', 'city', 'vibeSchedules', 'offers'],
    });

    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }

  async findNearby(
    lat: number,
    lng: number,
    radiusKm: number = 5,
  ): Promise<Venue[]> {
    return this.venueRepo
      .createQueryBuilder('venue')
      .leftJoinAndSelect('venue.liveState', 'liveState')
      .leftJoinAndSelect('venue.city', 'city')
      .leftJoinAndSelect('venue.offers', 'offers')
      .where('venue.isActive = :isActive', { isActive: true })
      .andWhere('venue.lat IS NOT NULL AND venue.lng IS NOT NULL')
      .andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(venue.lat)) * cos(radians(venue.lng) - radians(:lng)) + sin(radians(:lat)) * sin(radians(venue.lat)))) <= :radius`,
        { lat, lng, radius: radiusKm },
      )
      .orderBy('venue.name', 'ASC')
      .getMany();
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param lat1 Latitude of point 1
   * @param lng1 Longitude of point 1
   * @param lat2 Latitude of point 2
   * @param lng2 Longitude of point 2
   * @returns Distance in kilometers
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Search venues by name or description
   * @param query Search query string
   * @param cityId Optional city filter
   * @returns Matching venues
   */
  async search(query: string, cityId?: string): Promise<Venue[]> {
    const queryBuilder = this.venueRepo
      .createQueryBuilder('venue')
      .leftJoinAndSelect('venue.liveState', 'liveState')
      .leftJoinAndSelect('venue.city', 'city')
      .leftJoinAndSelect('venue.offers', 'offers')
      .where('venue.isActive = :isActive', { isActive: true })
      .andWhere(
        '(LOWER(venue.name) LIKE LOWER(:query) OR LOWER(venue.description) LIKE LOWER(:query))',
        { query: `%${query}%` },
      );

    if (cityId) {
      queryBuilder.andWhere('venue.city_id = :cityId', { cityId });
    }

    return queryBuilder.orderBy('venue.name', 'ASC').getMany();
  }

  async findAll(): Promise<Venue[]> {
    return this.venueRepo.find({
      where: { isActive: true },
      relations: ['liveState', 'city', 'offers'],
      order: { name: 'ASC' },
    });
  }
}
