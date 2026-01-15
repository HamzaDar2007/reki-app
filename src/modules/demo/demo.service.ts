import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VenueLiveState } from '../venues/entities/venue-live-state.entity';
import { Venue } from '../venues/entities/venue.entity';
import {
  BusynessLevel,
  VibeType,
} from '../venues/entities/venue-live-state.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class DemoService {
  constructor(
    @InjectRepository(VenueLiveState)
    private liveStateRepo: Repository<VenueLiveState>,
    @InjectRepository(Venue)
    private venueRepo: Repository<Venue>,
    private notificationsService: NotificationsService,
  ) {}

  async simulateFridayEvening(): Promise<{
    message: string;
    venuesUpdated: number;
  }> {
    const venues = await this.venueRepo.find({ where: { isActive: true } });

    for (const venue of venues) {
      await this.liveStateRepo.update(
        { venue: { id: venue.id } },
        {
          busyness: BusynessLevel.BUSY,
          vibe: VibeType.PARTY,
          busynessUpdatedAt: new Date(),
          vibeUpdatedAt: new Date(),
        },
      );
    }

    await this.notificationsService.notifyAll(
      'Friday Night Vibes! 🍸',
      'It is picking up in Manchester! Most venues are now BUSY with a PARTY vibe.',
      NotificationType.BUSYNESS_UPDATE,
    );

    return {
      message:
        'Friday evening simulation applied - all venues are now BUSY with PARTY vibe',
      venuesUpdated: venues.length,
    };
  }

  async simulateQuietMonday(): Promise<{
    message: string;
    venuesUpdated: number;
  }> {
    const venues = await this.venueRepo.find({ where: { isActive: true } });

    for (const venue of venues) {
      await this.liveStateRepo.update(
        { venue: { id: venue.id } },
        {
          busyness: BusynessLevel.QUIET,
          vibe: VibeType.CHILL,
          busynessUpdatedAt: new Date(),
          vibeUpdatedAt: new Date(),
        },
      );
    }

    await this.notificationsService.notifyAll(
      'Quiet Monday Morning ☕',
      'Start your week right! Venues are QUIET and CHILL right now.',
      NotificationType.BUSYNESS_UPDATE,
    );

    return {
      message:
        'Monday morning simulation applied - all venues are now QUIET with CHILL vibe',
      venuesUpdated: venues.length,
    };
  }

  async simulateMixedBusyness(): Promise<{
    message: string;
    venuesUpdated: number;
  }> {
    const venues = await this.venueRepo.find({ where: { isActive: true } });
    const busynessLevels = [
      BusynessLevel.QUIET,
      BusynessLevel.MODERATE,
      BusynessLevel.BUSY,
    ];
    const vibes = [VibeType.CHILL, VibeType.SOCIAL, VibeType.PARTY];

    for (let i = 0; i < venues.length; i++) {
      const busyness = busynessLevels[i % busynessLevels.length];
      const vibe = vibes[i % vibes.length];

      await this.liveStateRepo.update(
        { venue: { id: venues[i].id } },
        {
          busyness,
          vibe,
          busynessUpdatedAt: new Date(),
          vibeUpdatedAt: new Date(),
        },
      );
    }

    return {
      message:
        'Mixed busyness simulation applied - venues now have varied states',
      venuesUpdated: venues.length,
    };
  }

  async resetToDefault(): Promise<{ message: string; venuesUpdated: number }> {
    const venues = await this.venueRepo.find({ where: { isActive: true } });

    for (const venue of venues) {
      await this.liveStateRepo.update(
        { venue: { id: venue.id } },
        {
          busyness: BusynessLevel.QUIET,
          vibe: VibeType.CHILL,
          busynessUpdatedAt: new Date(),
          vibeUpdatedAt: new Date(),
        },
      );
    }

    return {
      message: 'Demo reset complete - all venues back to default state',
      venuesUpdated: venues.length,
    };
  }
}
