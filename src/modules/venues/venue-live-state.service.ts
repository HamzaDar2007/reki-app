import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  VenueLiveState,
  BusynessLevel,
  VibeType,
} from './entities/venue-live-state.entity';
import { UpdateVenueLiveStateDto } from './dto/update-venue-live-state.dto';

@Injectable()
export class VenueLiveStateService {
  constructor(
    @InjectRepository(VenueLiveState)
    private readonly stateRepo: Repository<VenueLiveState>,
  ) {}

  async findByVenueId(venueId: string): Promise<VenueLiveState> {
    const state = await this.stateRepo.findOne({
      where: { venue: { id: venueId } },
      relations: ['venue'],
    });

    if (!state) throw new NotFoundException('Live state not found');
    return state;
  }

  async update(
    venueId: string,
    dto: UpdateVenueLiveStateDto,
  ): Promise<VenueLiveState> {
    const state = await this.findByVenueId(venueId);

    if (dto.busyness !== undefined) {
      state.busyness = dto.busyness;
      state.busynessUpdatedAt = new Date();
    }

    if (dto.vibe !== undefined) {
      state.vibe = dto.vibe;
      state.vibeUpdatedAt = new Date();
    }

    return this.stateRepo.save(state);
  }

  async updateBusyness(
    venueId: string,
    busyness: BusynessLevel,
  ): Promise<VenueLiveState> {
    return this.update(venueId, { busyness });
  }

  async updateVibe(venueId: string, vibe: VibeType): Promise<VenueLiveState> {
    return this.update(venueId, { vibe });
  }

  async getBusynessStats(): Promise<{ level: BusynessLevel; count: number }[]> {
    const stats = await this.stateRepo
      .createQueryBuilder('state')
      .select('state.busyness', 'level')
      .addSelect('COUNT(*)', 'count')
      .innerJoin('state.venue', 'venue')
      .where('venue.isActive = :isActive', { isActive: true })
      .groupBy('state.busyness')
      .getRawMany();

    return stats.map((stat: Record<string, any>) => ({
      level: stat.level as BusynessLevel,
      count: parseInt(stat.count as string),
    }));
  }
}
