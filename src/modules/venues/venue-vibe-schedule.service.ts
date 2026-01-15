import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VenueVibeSchedule } from './entities/venue-vibe-schedule.entity';
import { VibeType } from './entities/venue-live-state.entity';
import { CreateVibeScheduleDto } from './dto/create-vibe-schedule.dto';

@Injectable()
export class VenueVibeScheduleService {
  constructor(
    @InjectRepository(VenueVibeSchedule)
    private readonly scheduleRepo: Repository<VenueVibeSchedule>,
  ) {}

  async create(
    venueId: string,
    dto: CreateVibeScheduleDto,
  ): Promise<VenueVibeSchedule> {
    const schedule = this.scheduleRepo.create({
      venue: { id: venueId },
      ...dto,
      priority: dto.priority ?? 0,
      isActive: dto.isActive ?? true,
    });

    return this.scheduleRepo.save(schedule);
  }

  async findByVenue(venueId: string): Promise<VenueVibeSchedule[]> {
    return this.scheduleRepo.find({
      where: { venue: { id: venueId } },
      order: { dayOfWeek: 'ASC', startTime: 'ASC', priority: 'DESC' },
    });
  }

  async getActiveSchedules(venueId: string): Promise<VenueVibeSchedule[]> {
    return this.scheduleRepo.find({
      where: {
        venue: { id: venueId },
        isActive: true,
      },
      order: { priority: 'DESC', startTime: 'ASC' },
    });
  }

  async delete(id: string): Promise<void> {
    const result = await this.scheduleRepo.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Vibe schedule not found');
    }
  }

  /**
   * FIXED: Timezone-correct vibe scheduling
   * Uses Manchester timezone (Europe/London)
   */
  async computeCurrentVibe(
    venueId: string,
    now: Date = new Date(),
  ): Promise<VibeType | null> {
    // Convert to Manchester timezone
    const manchesterTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const manchesterDate = new Date(
      now.toLocaleString('en-US', { timeZone: 'Europe/London' }),
    );
    const day = manchesterDate.getDay();
    const hour =
      manchesterTime.find((part) => part.type === 'hour')?.value || '00';
    const minute =
      manchesterTime.find((part) => part.type === 'minute')?.value || '00';
    const time = `${hour}:${minute}`;

    const schedules = await this.getActiveSchedules(venueId);

    // Find matching schedule for current day and time
    const match = schedules.find(
      (s) => s.dayOfWeek === day && s.startTime <= time && s.endTime >= time,
    );

    return match ? match.vibe : null;
  }

  /**
   * Get the next scheduled vibe change for a venue
   */
  async getNextVibeChange(
    venueId: string,
    now: Date = new Date(),
  ): Promise<{
    vibe: VibeType;
    startsAt: string;
    dayOfWeek: number;
  } | null> {
    // Convert to Manchester timezone
    const manchesterTime = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(now);

    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    const manchesterDate = new Date(
      now.toLocaleString('en-US', { timeZone: 'Europe/London' }),
    );
    const currentDay = manchesterDate.getDay();
    const hour =
      manchesterTime.find((part) => part.type === 'hour')?.value || '00';
    const minute =
      manchesterTime.find((part) => part.type === 'minute')?.value || '00';
    const currentTime = `${hour}:${minute}`;

    const schedules = await this.getActiveSchedules(venueId);

    // Look for next schedule today
    const todayNext = schedules.find(
      (s) => s.dayOfWeek === currentDay && s.startTime > currentTime,
    );

    if (todayNext) {
      return {
        vibe: todayNext.vibe,
        startsAt: todayNext.startTime,
        dayOfWeek: todayNext.dayOfWeek,
      };
    }

    // Look for next schedule in upcoming days
    for (let i = 1; i <= 7; i++) {
      const checkDay = (currentDay + i) % 7;
      const nextDaySchedule = schedules.find((s) => s.dayOfWeek === checkDay);

      if (nextDaySchedule) {
        return {
          vibe: nextDaySchedule.vibe,
          startsAt: nextDaySchedule.startTime,
          dayOfWeek: nextDaySchedule.dayOfWeek,
        };
      }
    }

    return null;
  }
}
