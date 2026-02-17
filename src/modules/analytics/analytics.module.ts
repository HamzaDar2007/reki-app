import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Venue } from '../venues/entities/venue.entity';
import { Offer } from '../offers/entities/offer.entity';
import { OfferRedemption } from '../offers/entities/offer-redemption.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { VenuesModule } from '../venues/venues.module';
import { OffersModule } from '../offers/offers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venue, Offer, OfferRedemption, Notification]),
    VenuesModule,
    OffersModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
