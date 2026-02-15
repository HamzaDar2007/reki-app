import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { VenueLiveStateService } from './venue-live-state.service';
import { VenueVibeScheduleService } from './venue-vibe-schedule.service';
import { Venue } from './entities/venue.entity';
import { VenueLiveState } from './entities/venue-live-state.entity';
import { VenueVibeSchedule } from './entities/venue-vibe-schedule.entity';
import { UserPreferences } from '../users/entities/user-preferences.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venue, VenueLiveState, VenueVibeSchedule, UserPreferences]),
  ],
  controllers: [VenuesController],
  providers: [VenuesService, VenueLiveStateService, VenueVibeScheduleService],
  exports: [VenuesService, VenueLiveStateService, VenueVibeScheduleService],
})
export class VenuesModule {}
