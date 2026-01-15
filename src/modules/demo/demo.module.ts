import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemoController } from './demo.controller';
import { DemoService } from './demo.service';
import { VenueLiveState } from '../venues/entities/venue-live-state.entity';
import { Venue } from '../venues/entities/venue.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([VenueLiveState, Venue]),
  ],
  controllers: [DemoController],
  providers: [DemoService],
  exports: [DemoService],
})
export class DemoModule {}
