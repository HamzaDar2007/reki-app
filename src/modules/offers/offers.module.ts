import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OffersController } from './offers.controller';
import { OffersService } from './offers.service';
import { Offer } from './entities/offer.entity';
import { OfferRedemption } from './entities/offer-redemption.entity';
import { VenueLiveState } from '../venues/entities/venue-live-state.entity';
import { VenuesModule } from '../venues/venues.module';

@Module({
  imports: [
    VenuesModule,
    TypeOrmModule.forFeature([Offer, OfferRedemption, VenueLiveState]),
  ],
  controllers: [OffersController],
  providers: [OffersService],
  exports: [OffersService],
})
export class OffersModule {}
