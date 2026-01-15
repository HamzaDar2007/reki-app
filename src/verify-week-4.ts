import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';
import { VenuesService } from './modules/venues/venues.service';
import { VenueLiveStateService } from './modules/venues/venue-live-state.service';
import {
  VibeType,
  BusynessLevel,
} from './modules/venues/entities/venue-live-state.entity';
import { OffersService } from './modules/offers/offers.service';
import { OfferType } from './modules/offers/entities/offer.entity';
import { VenueCategory } from './modules/venues/entities/venue.entity';
import { INestApplicationContext } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { City } from './modules/cities/entities/city.entity';
import { Repository } from 'typeorm';

async function bootstrap() {
  console.log('🚀 Starting Week 4 Verification...');

  const appContext: INestApplicationContext =
    await NestFactory.createApplicationContext(AppModule);
  const usersService = appContext.get(UsersService);
  const venuesService = appContext.get(VenuesService);
  const liveStateService = appContext.get(VenueLiveStateService);
  const offersService = appContext.get(OffersService);
  const cityRepo = appContext.get<Repository<City>>(getRepositoryToken(City));

  try {
    // 1. Setup - Get a City ID (Manchester)
    const cities = await cityRepo.find({ where: { name: 'Manchester' } });
    if (cities.length === 0) throw new Error('Manchester city not found in DB');
    const cityId = cities[0].id;
    console.log(`📍 Using City ID: ${cityId} (Manchester)`);

    // 2. Create Owners
    const ownerEmail = `owner_${Date.now()}@reki.com`;
    const hackerEmail = `hacker_${Date.now()}@reki.com`;

    const owner = await usersService.create({
      email: ownerEmail,
      password: 'password123',
    });
    await usersService.create({
      email: hackerEmail,
      password: 'password123',
    });
    console.log(`✅ Created Owner: ${ownerEmail}`);
    console.log(`✅ Created Hacker: ${hackerEmail}`);

    // 3. Create Venue as Owner
    const venue = await venuesService.create(
      {
        cityId,
        name: 'Test Business Lounge',
        category: VenueCategory.BAR,
        address: '123 Business Way',
      },
      owner.id,
    );
    console.log(`✅ Created Venue: "${venue.name}" with Owner: ${ownerEmail}`);

    // 4. Test Ownership Enforcement
    console.log('🛡️ Testing Ownership Enforcement...');
    if (venue.ownerId === owner.id) {
      console.log('   ✅ Ownership correctly assigned to Owner.');
    } else {
      throw new Error('❌ Ownership mismatch!');
    }

    // 5. Update Live State
    console.log('📈 Updating Live State...');
    const updatedState = await liveStateService.update(venue.id, {
      busyness: BusynessLevel.BUSY,
      vibe: VibeType.SOCIAL,
    });
    console.log(
      `   ✅ New State: ${updatedState.busyness} / ${updatedState.vibe}`,
    );

    // 6. Create Offer
    console.log('🎁 Creating Smart Offer...');
    const offer = await offersService.create({
      venueId: venue.id,
      title: 'Business Networking Deal',
      description: 'Free coffee when busy',
      offerType: OfferType.FREE_ITEM,
      minBusyness: BusynessLevel.BUSY,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 3600000).toISOString(),
    });
    console.log(`   ✅ Created Offer: "${offer.title}"`);

    // 7. Verify Analytics
    console.log('📊 Verifying Analytics...');
    await offersService.incrementViewCount(offer.id);
    await offersService.incrementClickCount(offer.id);
    await offersService.incrementClickCount(offer.id);

    const stats = await offersService.getOfferStats(offer.id);
    console.log(
      `   ✅ Stats -> Views: ${stats.views}, Clicks: ${stats.clicks}, Redemptions: ${stats.redemptions}`,
    );

    if (stats.views === 1 && stats.clicks === 2) {
      console.log('🎉 ANALYTICS VERIFIED');
    } else {
      throw new Error('❌ Analytics mismatch!');
    }

    // 8. Test Offer Status Toggle
    console.log('🔄 Testing Offer Status Toggle...');
    const deactivatedOffer = await offersService.updateStatus(offer.id, false);
    console.log(
      `   ✅ Offer "${deactivatedOffer.title}" active status: ${deactivatedOffer.isActive}`,
    );

    if (deactivatedOffer.isActive === false) {
      console.log('🎉 STATUS TOGGLE VERIFIED');
    } else {
      throw new Error('❌ Status toggle failed!');
    }

    console.log('\n🌟 WEEK 4 BUSINESS CONTROL LAYER VERIFIED SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await appContext.close();
  }
}

void bootstrap();
