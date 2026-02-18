import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { Offer } from './entities/offer.entity';
import { OfferRedemption } from './entities/offer-redemption.entity';
import { VenueLiveState } from '../venues/entities/venue-live-state.entity';
import { Venue } from '../venues/entities/venue.entity';
import { VenuesModule } from '../venues/venues.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    VenuesModule,
    NotificationsModule,
    TypeOrmModule.forFeature([Offer, OfferRedemption, VenueLiveState, Venue]),
  ],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
