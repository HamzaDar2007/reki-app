import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venue } from './entities/venue.entity';
import { VenueLiveState } from './entities/venue-live-state.entity';
import { CreateVenueDto } from './dto/create-venue.dto';

@Injectable()
export class VenuesService {
  constructor(
    @InjectRepository(Venue)
    private readonly venueRepo: Repository<Venue>,
    @InjectRepository(VenueLiveState)
    private readonly liveStateRepo: Repository<VenueLiveState>,
  ) {}

  async create(dto: CreateVenueDto, ownerId?: string): Promise<Venue> {
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

    return savedVenue;
  }

  async findByCity(cityId: string): Promise<Venue[]> {
    return this.venueRepo.find({
      where: {
        city: { id: cityId },
        isActive: true,
      },
      relations: ['liveState', 'city'],
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
      .where('venue.isActive = :isActive', { isActive: true })
      .andWhere('venue.lat IS NOT NULL AND venue.lng IS NOT NULL')
      .andWhere(
        `(6371 * acos(cos(radians(:lat)) * cos(radians(venue.lat)) * cos(radians(venue.lng) - radians(:lng)) + sin(radians(:lat)) * sin(radians(venue.lat)))) <= :radius`,
        { lat, lng, radius: radiusKm },
      )
      .orderBy('venue.name', 'ASC')
      .getMany();
  }
}
