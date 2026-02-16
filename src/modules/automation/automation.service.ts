import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venue } from '../venues/entities/venue.entity';
import {
  VenueLiveState,
  BusynessLevel,
  VibeType,
} from '../venues/entities/venue-live-state.entity';
import { VenueVibeSchedule } from '../venues/entities/venue-vibe-schedule.entity';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    @InjectRepository(Venue)
    private readonly venueRepo: Repository<Venue>,
    @InjectRepository(VenueLiveState)
    private readonly liveStateRepo: Repository<VenueLiveState>,
    @InjectRepository(VenueVibeSchedule)
    private readonly vibeScheduleRepo: Repository<VenueVibeSchedule>,
  ) {}

  // Run every 5 minutes to update vibes based on schedules
  @Cron(CronExpression.EVERY_5_MINUTES)
  async updateVibesFromSchedules() {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      this.logger.log(
        `Running vibe schedule update - Day: ${dayOfWeek}, Time: ${currentTime}`,
      );

      // Get all active schedules for current day
      const schedules = await this.vibeScheduleRepo.find({
        where: { dayOfWeek, isActive: true },
        relations: ['venue'],
        order: { priority: 'DESC' },
      });

      let updatedCount = 0;

      for (const schedule of schedules) {
        // Check if current time falls within schedule
        if (
          this.isTimeInRange(currentTime, schedule.startTime, schedule.endTime)
        ) {
          // Update venue live state with scheduled vibe
          const liveState = await this.liveStateRepo.findOne({
            where: { venue: { id: schedule.venue.id } },
          });

          if (liveState && liveState.vibe !== schedule.vibe) {
            liveState.vibe = schedule.vibe;
            liveState.vibeUpdatedAt = new Date();
            await this.liveStateRepo.save(liveState);
            updatedCount++;
            this.logger.log(
              `Updated ${schedule.venue.name} vibe to ${schedule.vibe}`,
            );
          }
        }
      }

      if (updatedCount > 0) {
        this.logger.log(`Updated ${updatedCount} venue vibes from schedules`);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error updating vibes from schedules: ${err.message}`);
    }
  }

  // Run every 30 minutes to simulate realistic busyness changes
  @Cron(CronExpression.EVERY_30_MINUTES)
  async simulateBusynessChanges() {
    try {
      const now = new Date();
      const hour = now.getHours();

      this.logger.log(`Simulating busyness changes for hour: ${hour}`);

      // Get all venues
      const venues = await this.venueRepo.find();

      let updatedCount = 0;

      for (const venue of venues) {
        const liveState = await this.liveStateRepo.findOne({
          where: { venue: { id: venue.id } },
        });

        if (liveState) {
          const newBusyness = this.calculateBusynessForHour(
            hour,
            venue.category,
          );

          if (liveState.busyness !== newBusyness) {
            liveState.busyness = newBusyness;
            liveState.busynessUpdatedAt = new Date();
            await this.liveStateRepo.save(liveState);
            updatedCount++;
          }
        }
      }

      if (updatedCount > 0) {
        this.logger.log(`Updated busyness for ${updatedCount} venues`);
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Error simulating busyness changes: ${err.message}`);
    }
  }

  // Helper: Check if current time is within schedule range
  private isTimeInRange(
    currentTime: string,
    startTime: string,
    endTime: string,
  ): boolean {
    const [currentH, currentM] = currentTime.split(':').map(Number);
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const currentMinutes = currentH * 60 + currentM;
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // Handle overnight range (e.g., 22:00 - 02:00)
    if (endMinutes < startMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    }

    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  // Helper: Calculate realistic busyness based on time of day and venue type
  private calculateBusynessForHour(
    hour: number,
    category: string,
  ): BusynessLevel {
    // Different patterns for different venue types
    if (category === 'CLUB') {
      if (hour >= 0 && hour < 6) return BusynessLevel.BUSY; // Late night
      if (hour >= 6 && hour < 17) return BusynessLevel.QUIET; // Closed/quiet
      if (hour >= 17 && hour < 21) return BusynessLevel.MODERATE; // Early evening
      if (hour >= 21) return BusynessLevel.BUSY; // Peak time
    }

    if (category === 'BAR') {
      if (hour >= 0 && hour < 3) return BusynessLevel.BUSY; // Late night
      if (hour >= 3 && hour < 16) return BusynessLevel.QUIET; // Closed/quiet
      if (hour >= 16 && hour < 19) return BusynessLevel.MODERATE; // Happy hour
      if (hour >= 19 && hour < 23) return BusynessLevel.BUSY; // Peak time
      if (hour >= 23) return BusynessLevel.MODERATE; // Winding down
    }

    if (category === 'RESTAURANT') {
      if (hour >= 0 && hour < 11) return BusynessLevel.QUIET; // Closed
      if (hour >= 11 && hour < 14) return BusynessLevel.BUSY; // Lunch rush
      if (hour >= 14 && hour < 17) return BusynessLevel.QUIET; // Afternoon lull
      if (hour >= 17 && hour < 21) return BusynessLevel.BUSY; // Dinner rush
      if (hour >= 21) return BusynessLevel.MODERATE; // Late dining
    }

    return BusynessLevel.MODERATE; // Default
  }

  // Manual trigger for demo purposes
  async triggerDemoScenario(
    scenario: 'quiet_to_busy' | 'busy_to_quiet' | 'vibe_shift',
  ): Promise<{ message: string; affected: number }> {
    this.logger.log(`Triggering demo scenario: ${scenario}`);

    const venues = await this.venueRepo.find({ take: 5 }); // Affect first 5 venues
    let affected = 0;

    for (const venue of venues) {
      const liveState = await this.liveStateRepo.findOne({
        where: { venue: { id: venue.id } },
      });

      if (liveState) {
        switch (scenario) {
          case 'quiet_to_busy':
            liveState.busyness = BusynessLevel.BUSY;
            liveState.vibe = VibeType.PARTY;
            break;

          case 'busy_to_quiet':
            liveState.busyness = BusynessLevel.QUIET;
            liveState.vibe = VibeType.CHILL;
            break;

          case 'vibe_shift':
            liveState.vibe =
              liveState.vibe === VibeType.CHILL
                ? VibeType.PARTY
                : VibeType.CHILL;
            break;
        }

        liveState.busynessUpdatedAt = new Date();
        liveState.vibeUpdatedAt = new Date();
        await this.liveStateRepo.save(liveState);
        affected++;
      }
    }

    return {
      message: `Demo scenario '${scenario}' applied successfully`,
      affected,
    };
  }

  // Get current automation status
  async getAutomationStatus(): Promise<{
    scheduledVibes: number;
    activeVenues: number;
    lastUpdate: Date;
  }> {
    const now = new Date();
    const dayOfWeek = now.getDay();

    const scheduledVibes = await this.vibeScheduleRepo.count({
      where: { dayOfWeek, isActive: true },
    });

    const activeVenues = await this.venueRepo.count();

    const latestUpdate = await this.liveStateRepo
      .createQueryBuilder('live_state')
      .orderBy('live_state.updated_at', 'DESC')
      .getOne();

    return {
      scheduledVibes,
      activeVenues,
      lastUpdate: latestUpdate?.updatedAt || new Date(),
    };
  }
}
