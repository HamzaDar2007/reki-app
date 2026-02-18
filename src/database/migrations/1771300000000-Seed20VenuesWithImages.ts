import { MigrationInterface, QueryRunner } from 'typeorm';

export class Seed20VenuesWithImages1771300000000 implements MigrationInterface {
  name = 'Seed20VenuesWithImages1771300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Insert Manchester city
    const manchester = (await queryRunner.query(`
      INSERT INTO cities (name, country_code, timezone, is_active, center_lat, center_lng)
      VALUES ('Manchester', 'GB', 'Europe/London', true, 53.480759, -2.242631)
      ON CONFLICT (name, country_code) DO UPDATE SET
        timezone = EXCLUDED.timezone,
        is_active = EXCLUDED.is_active,
        center_lat = EXCLUDED.center_lat,
        center_lng = EXCLUDED.center_lng,
        updated_at = now()
      RETURNING id
    `)) as { id: string }[];

    const cityId = manchester?.[0]?.id;
    if (!cityId) throw new Error('Failed to seed Manchester city');

    // 2) Clear existing venues for this city (fresh start)
    await queryRunner.query(`
      DELETE FROM venues WHERE city_id = '${cityId}'
    `);

    // 3) Insert 20 venues with cover images
    const venues = (await queryRunner.query(`
      INSERT INTO venues (city_id, name, category, address, postcode, lat, lng, cover_image_url, description, is_active)
      VALUES
        -- BARS (5 venues)
        ('${cityId}', 'Cloud 23', 'BAR', 'Deansgate, Manchester', 'M3', 53.4794, -2.2493, '/images/bar/Cloud 23.jpg', 'Contemporary cocktail bar with stunning city views', true),
        ('${cityId}', 'NQ64', 'BAR', 'NQ, Manchester', 'M4', 53.4840, -2.2380, '/images/bar/NQ64.jpg', 'Retro arcade bar with craft beers and cocktails', true),
        ('${cityId}', 'Albert''s Schloss', 'BAR', 'Peter St, Manchester', 'M2', 53.4774, -2.2452, '/images/bar/Albert''s Schloss.jpg', 'Beer hall with late-night energy and live entertainment', true),
        ('${cityId}', 'Schofield''s Bar', 'BAR', 'Fountain St, Manchester', 'M2', 53.4795, -2.2380, '/images/bar/Schofield''s Bar.jpg', 'Historic pub with modern vibes', true),
        ('${cityId}', 'The Edinburgh Castle', 'BAR', 'Parsonage, Manchester', 'M3', 53.4808, -2.2426, '/images/bar/The Edinburgh Castle.jpg', 'Authentic Scottish bar experience', true),

        -- CASINOS (5 venues)
        ('${cityId}', 'Admiral Casino', 'CASINO', 'Whitworth St, Manchester', 'M1', 53.4750, -2.2400, '/images/casino/Admiral Casino.avif', 'Premier casino with table games and slots', true),
        ('${cityId}', 'Genting Casino Manchester', 'CASINO', 'Deansgate, Manchester', 'M3', 53.4780, -2.2490, '/images/casino/Genting Casino Manchester.jpg', 'Large gaming floor with premium facilities', true),
        ('${cityId}', 'Grosvenor Casino', 'CASINO', 'Fountain St, Manchester', 'M2', 53.4790, -2.2380, '/images/casino/Grosvenor Casino.jpg', 'Elegant casino complex with restaurant and dining', true),
        ('${cityId}', 'Manchester235 Casino', 'CASINO', 'Manchester St, Manchester', 'M1', 53.4760, -2.2370, '/images/casino/manchester235-casino.jpg', 'Modern gaming venue with full entertainment', true),
        ('${cityId}', 'Napoleons Casino', 'CASINO', 'Deansgate-Castlefield, Manchester', 'M3', 53.4750, -2.2550, '/images/casino/napoleons-casino-manchester.jpg', 'Casino and restaurant with live entertainment', true),

        -- HOTELS (5 venues)
        ('${cityId}', 'Hotel Gotham', 'RESTAURANT', 'Whitworth St, Manchester', 'M1', 53.4745, -2.2395, '/images/hotels/Hotel-Gotham.avif', 'Art Deco luxury hotel with rooftop bar', true),
        ('${cityId}', 'Dakota Manchester', 'RESTAURANT', 'William St, Manchester', 'M1', 53.4755, -2.2365, '/images/hotels/Dakota Manchester.jpg', 'Stylish hotel with modern bar and restaurant', true),
        ('${cityId}', 'Kimpton Clocktower', 'RESTAURANT', 'Whitworth St, Manchester', 'M1', 53.4742, -2.2406, '/images/hotels/Kimpton Clocktower.jpg', 'Historic Clocktower converted to luxury hotel', true),
        ('${cityId}', 'The Edwardian Manchester', 'RESTAURANT', 'Mount St, Manchester', 'M2', 53.4800, -2.2350, '/images/hotels/The Edwardian Manchester.jpg', 'Elegant hotel with fine dining options', true),
        ('${cityId}', 'The Stock Exchange Hotel', 'RESTAURANT', 'High St, Manchester', 'M4', 53.4850, -2.2370, '/images/hotels/The Stock Exchange Hotel.jpg', 'Historic hotel in trading hall with premium venues', true),

        -- RESTAURANTS (5 venues)
        ('${cityId}', 'Dishoom', 'RESTAURANT', 'Bridge St, Manchester', 'M3', 53.4825, -2.2450, '/images/restorantes/Dishoom.avif', 'Michelin-starred fine dining experience', true),
        ('${cityId}', '20 Stories', 'RESTAURANT', 'Deansgate-Castlefield, Manchester', 'M3', 53.4780, -2.2540, '/images/restorantes/20 Stories.jpg', 'Rooftop restaurant with panoramic views', true),
        ('${cityId}', 'The Black Friar', 'RESTAURANT', 'Castle St, Manchester', 'M3', 53.4750, -2.2500, '/images/restorantes/The Black Friar.jpg', 'Historic pub and restaurant', true),
        ('${cityId}', 'mana', 'RESTAURANT', 'Oxford Rd, Manchester', 'M1', 53.4700, -2.2360, '/images/restorantes/mana.webp', 'Contemporary Nordic-inspired cuisine', true),
        ('${cityId}', 'skof', 'RESTAURANT', 'Tib St, Manchester', 'M4', 53.4840, -2.2340, '/images/restorantes/skof.webp', 'Contemporary Nordic-inspired fine dining', true)
      RETURNING id, name, category
    `)) as { id: string; name: string; category: string }[];

    console.log(`✓ Created ${venues.length} venues with images`);

    // 4) Create initial live states for all venues
    for (const v of venues) {
      await queryRunner.query(`
        INSERT INTO venue_live_state (venue_id, busyness, vibe)
        VALUES ('${v.id}', 'QUIET', 'CHILL')
        ON CONFLICT (venue_id) DO NOTHING
      `);
    }

    // 5) Add comprehensive vibe schedules
    for (const v of venues) {
      await queryRunner.query(`
        INSERT INTO venue_vibe_schedule (venue_id, day_of_week, start_time, end_time, vibe, priority, is_active)
        VALUES
          -- Monday (1)
          ('${v.id}', 1, '17:00', '20:00', 'CHILL', 1, true),
          ('${v.id}', 1, '20:00', '23:00', 'SOCIAL', 2, true),
          
          -- Tuesday (2)
          ('${v.id}', 2, '17:00', '20:00', 'CHILL', 1, true),
          ('${v.id}', 2, '20:00', '23:00', 'SOCIAL', 2, true),
          
          -- Wednesday (3)
          ('${v.id}', 3, '17:00', '19:00', 'CHILL', 1, true),
          ('${v.id}', 3, '19:00', '22:00', 'SOCIAL', 2, true),
          ('${v.id}', 3, '22:00', '23:59', 'PARTY', 3, true),
          
          -- Thursday (4)
          ('${v.id}', 4, '17:00', '19:00', 'CHILL', 1, true),
          ('${v.id}', 4, '19:00', '21:00', 'SOCIAL', 2, true),
          ('${v.id}', 4, '21:00', '23:59', 'PARTY', 3, true),
          
          -- Friday (5)
          ('${v.id}', 5, '17:00', '19:00', 'CHILL', 1, true),
          ('${v.id}', 5, '19:00', '22:00', 'SOCIAL', 2, true),
          ('${v.id}', 5, '22:00', '23:59', 'PARTY', 3, true),
          
          -- Saturday (6)
          ('${v.id}', 6, '16:00', '19:00', 'CHILL', 1, true),
          ('${v.id}', 6, '19:00', '21:00', 'SOCIAL', 2, true),
          ('${v.id}', 6, '21:00', '23:59', 'PARTY', 3, true),
          
          -- Sunday (0)
          ('${v.id}', 0, '12:00', '18:00', 'CHILL', 1, true),
          ('${v.id}', 0, '18:00', '22:00', 'SOCIAL', 2, true)
      `);
    }

    // 6) Add offers for each category
    let offerIndex = 0;
    const offerTitles = [
      'Happy Hour Special',
      'Weekend Deal',
      'VIP Package',
      'Group Discount',
      'Premium Experience'
    ];

    const offerDescriptions = [
      'Enjoy special pricing during select hours',
      'Great deals throughout the weekend',
      'Exclusive VIP table service and perks',
      'Save 20% when you bring a group of friends',
      'Premium service with exclusive benefits'
    ];

    for (const v of venues) {
      const title = offerTitles[offerIndex % offerTitles.length];
      const description = offerDescriptions[offerIndex % offerDescriptions.length];
      const offerTypes = ['PERCENT_OFF', 'BOGO', 'FREE_ITEM', 'HAPPY_HOUR', 'ENTRY_DEAL'];
      const busynessLevels = ['QUIET', 'MODERATE', 'BUSY'];
      
      await queryRunner.query(`
        INSERT INTO offers (venue_id, title, description, offer_type, min_busyness, starts_at, ends_at, is_active)
        VALUES (
          '${v.id}',
          '${title}',
          '${description}',
          '${offerTypes[offerIndex % offerTypes.length]}',
          '${busynessLevels[offerIndex % busynessLevels.length]}',
          now(),
          now() + interval '30 days',
          true
        )
      `);
      offerIndex++;
    }

    console.log('✓ Seed migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove all venues created by this migration
    await queryRunner.query(`
      DELETE FROM venues 
      WHERE name IN (
        'Cloud 23', 'NQ64', 'Albert''s Schloss', 'Schofield''s Bar', 'The Edinburgh Castle',
        'Admiral Casino', 'Genting Casino Manchester', 'Grosvenor Casino', 'Manchester235 Casino', 'Napoleons Casino',
        'Hotel Gotham', 'Dakota Manchester', 'Kimpton Clocktower', 'The Edwardian Manchester', 'The Stock Exchange Hotel',
        'Dishoom', '20 Stories', 'The Black Friar', 'mana', 'skof'
      )
    `);
  }
}
