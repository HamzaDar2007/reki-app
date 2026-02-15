import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AutomationService } from './automation.service';
import { AutomationController } from './automation.controller';
import { Venue } from '../venues/entities/venue.entity';
import { VenueLiveState } from '../venues/entities/venue-live-state.entity';
import { VenueVibeSchedule } from '../venues/entities/venue-vibe-schedule.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([Venue, VenueLiveState, VenueVibeSchedule]),
  ],
  controllers: [AutomationController],
  providers: [AutomationService],
  exports: [AutomationService],
})
export class AutomationModule {}
