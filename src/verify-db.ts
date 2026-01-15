import { AppDataSource } from './database/data-source';

async function verifyDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection successful');

    // Check cities
    const cities = await AppDataSource.query('SELECT * FROM cities');
    console.log(`✅ Cities table: ${cities.length} records`);
    console.log('   Manchester:', (cities[0] as Record<string, any>)?.name);

    // Check venues
    const venues = await AppDataSource.query('SELECT * FROM venues');
    console.log(`✅ Venues table: ${venues.length} records`);
    venues.forEach((v: Record<string, any>, i: number) =>
      console.log(`   ${i + 1}. ${v.name} (${v.category as string})`),
    );

    // Check live states
    const liveStates = await AppDataSource.query(
      'SELECT * FROM venue_live_state',
    );
    console.log(`✅ Venue live states: ${liveStates.length} records`);

    // Check vibe schedules
    const vibeSchedules = await AppDataSource.query(
      'SELECT * FROM venue_vibe_schedule',
    );
    console.log(`✅ Vibe schedules: ${vibeSchedules.length} records`);

    // Check offers
    const offers = await AppDataSource.query('SELECT * FROM offers');
    console.log(`✅ Offers: ${offers.length} records`);
    offers.forEach((o: Record<string, any>, i: number) =>
      console.log(`   ${i + 1}. ${o.title} (${o.offer_type as string})`),
    );

    console.log('\n🎉 Week 1 & Week 2 database setup complete!');
    console.log('📊 Ready for REKI MVP development');
  } catch (error) {
    console.error('❌ Database verification failed:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

void verifyDatabase();
