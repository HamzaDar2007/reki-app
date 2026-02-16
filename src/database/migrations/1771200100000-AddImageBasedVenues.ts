import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * This migration adds comprehensive Manchester venues with images
 * Based on existing images in the images/ folder
 */
export class AddImageBasedVenues1771200100000 implements MigrationInterface {
  name = 'AddImageBasedVenues1771200100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get Manchester city ID
    const manchester = await queryRunner.query(`
      SELECT id FROM cities WHERE name = 'Manchester' AND country_code = 'GB'
    `);

    if (!manchester || manchester.length === 0) {
      throw new Error('Manchester city not found - run base seed first');
    }

    const cityId = manchester[0].id;

    // Add venues matching the images we have
    const newVenues = await queryRunner.query(`
      WITH new_venues AS (
        INSERT INTO venues (city_id, name, category, address, postcode, lat, lng, image_url, description, is_active)
        VALUES
          -- Bars (matching images in bar/ folder)
          ('${cityId}', 'Cloud 23', 'BAR', 'Beetham Tower, Deansgate', 'M3 4LQ', 53.4772, -2.2490, '/images/bar/Cloud 23.jpg', 'Sky-high cocktail bar with stunning city views', true),
          ('${cityId}', 'NQ64', 'BAR', 'Tib St, Northern Quarter', 'M4 1LX', 53.4835, -2.2351, '/images/bar/NQ64.jpg', 'Retro arcade bar with craft beers and cocktails', true),
          ('${cityId}', 'Schofield''s Bar', 'BAR', 'Sunlight House, Quay St', 'M3 3JZ', 53.4814, -2.2513, '/images/bar/Schofield''s Bar.jpg', 'Award-winning cocktail bar serving premium spirits', true),
          ('${cityId}', 'The Edinburgh Castle', 'BAR', 'Ancoats, Manchester', 'M4 5JD', 53.4853, -2.2283, '/images/bar/The Edinburgh Castle.jpg', 'Historic pub with modern vibes', true),
          
          -- Casinos (matching images in casino/ folder)
          ('${cityId}', 'Admiral Casino', 'CASINO', 'Portland St, Manchester', 'M1 3LD', 53.4796, -2.2408, '/images/casino/Admiral Casino.avif', 'Premier casino with table games and slots', true),
          ('${cityId}', 'Genting Casino Manchester', 'CASINO', 'Chinatown, Manchester', 'M1 3HF', 53.4783, -2.2383, '/images/casino/Genting Casino Manchester.jpg', 'Large casino complex with restaurant and bar', true),
          ('${cityId}', 'Grosvenor Casino', 'CASINO', 'Bury New Rd, Manchester', 'M8 8FW', 53.5128, -2.2531, '/images/casino/Grosvenor Casino.jpg', 'Elegant casino with poker room and dining', true),
          ('${cityId}', 'Manchester235 Casino', 'CASINO', 'Watson St, Manchester', 'M3 4EE', 53.4815, -2.2458, '/images/casino/manchester235-casino.jpg', 'Boutique casino in the heart of the city', true),
          ('${cityId}', 'Napoleons Casino Manchester', 'CASINO', 'Chinatown, Manchester', 'M1 5JG', 53.4775, -2.2388, '/images/casino/napoleons-casino-manchester.jpg', 'Casino and restaurant with live entertainment', true),
          
          -- Restaurants (matching images in restorantes/ folder)
          ('${cityId}', '20 Stories', 'RESTAURANT', 'No.1 Spinningfields', 'M3 3AY', 53.4810, -2.2524, '/images/restorantes/20 Stories.jpg', 'Rooftop restaurant with panoramic views', true),
          ('${cityId}', 'Dishoom', 'RESTAURANT', 'Bridge St, Manchester', 'M3 3BZ', 53.4808, -2.2515, '/images/restorantes/Dishoom.avif', 'Bombay-style cafe serving authentic Indian cuisine', true),
          ('${cityId}', 'Mana', 'RESTAURANT', 'Blossom St, Ancoats', 'M4 6AJ', 53.4860, -2.2264, '/images/restorantes/mana.webp', 'Michelin-starred fine dining experience', true),
          ('${cityId}', 'Skof', 'RESTAURANT', '16 Newton St', 'M1 1HL', 53.4793, -2.2347, '/images/restorantes/skof.webp', 'Contemporary Nordic-inspired cuisine', true),
          ('${cityId}', 'The Black Friar', 'RESTAURANT', 'Blackfriars St, Salford', 'M3 5AL', 53.4833, -2.2571, '/images/restorantes/The Black Friar.jpg', 'Historic pub and restaurant', true)
        RETURNING id, name, category
      )
      SELECT * FROM new_venues
    `);

    // Create live states for new venues
    for (const venue of newVenues) {
      await queryRunner.query(`
        INSERT INTO venue_live_state (venue_id, busyness, vibe)
        VALUES ('${venue.id}', 'QUIET', 'CHILL')
        ON CONFLICT (venue_id) DO NOTHING
      `);
    }

    // Add vibe schedules for new venues
    for (const venue of newVenues) {
      // Determine schedule based on category
      const isClub = venue.category === 'CLUB';
      const isCasino = venue.category === 'CASINO';
      const isRestaurant = venue.category === 'RESTAURANT';

      if (isClub) {
        // Clubs: Late night focus
        await queryRunner.query(`
          INSERT INTO venue_vibe_schedule (venue_id, day_of_week, start_time, end_time, vibe, priority, is_active)
          VALUES
            ('${venue.id}', 5, '22:00', '23:59', 'PARTY', 1, true),
            ('${venue.id}', 6, '22:00', '23:59', 'LATE_NIGHT', 1, true)
        `);
      } else if (isCasino) {
        // Casinos: Open all evening
        await queryRunner.query(`
          INSERT INTO venue_vibe_schedule (venue_id, day_of_week, start_time, end_time, vibe, priority, is_active)
          VALUES
            ('${venue.id}', 1, '18:00', '23:59', 'SOCIAL', 1, true),
            ('${venue.id}', 2, '18:00', '23:59', 'SOCIAL', 1, true),
            ('${venue.id}', 3, '18:00', '23:59', 'SOCIAL', 1, true),
            ('${venue.id}', 4, '18:00', '23:59', 'SOCIAL', 1, true),
            ('${venue.id}', 5, '18:00', '23:59', 'PARTY', 1, true),
            ('${venue.id}', 6, '18:00', '23:59', 'PARTY', 1, true),
            ('${venue.id}', 0, '18:00', '23:59', 'SOCIAL', 1, true)
        `);
      } else if (isRestaurant) {
        // Restaurants: Dinner focused
        await queryRunner.query(`
          INSERT INTO venue_vibe_schedule (venue_id, day_of_week, start_time, end_time, vibe, priority, is_active)
          VALUES
            ('${venue.id}', 1, '17:00', '22:00', 'CHILL', 1, true),
            ('${venue.id}', 2, '17:00', '22:00', 'CHILL', 1, true),
            ('${venue.id}', 3, '17:00', '22:00', 'CHILL', 1, true),
            ('${venue.id}', 4, '17:00', '22:00', 'SOCIAL', 1, true),
            ('${venue.id}', 5, '17:00', '23:00', 'SOCIAL', 1, true),
            ('${venue.id}', 6, '17:00', '23:00', 'SOCIAL', 1, true),
            ('${venue.id}', 0, '12:00', '21:00', 'CHILL', 1, true)
        `);
      } else {
        // Bars: Full progression
        await queryRunner.query(`
          INSERT INTO venue_vibe_schedule (venue_id, day_of_week, start_time, end_time, vibe, priority, is_active)
          VALUES
            ('${venue.id}', 5, '17:00', '19:00', 'CHILL', 1, true),
            ('${venue.id}', 5, '19:00', '22:00', 'SOCIAL', 2, true),
            ('${venue.id}', 5, '22:00', '23:59', 'PARTY', 3, true),
            ('${venue.id}', 6, '16:00', '19:00', 'CHILL', 1, true),
            ('${venue.id}', 6, '19:00', '22:00', 'SOCIAL', 2, true),
            ('${venue.id}', 6, '22:00', '23:59', 'PARTY', 3, true)
        `);
      }
    }

    // Add offers for new venues
    const offerVenues = newVenues.slice(0, 10); // Add offers to first 10 venues
    for (const venue of offerVenues) {
      const offerType = ['PERCENT_OFF', 'FREE_ITEM', 'BOGO', 'HAPPY_HOUR'][
        Math.floor(Math.random() * 4)
      ];
      const minBusyness = ['QUIET', 'MODERATE', 'BUSY'][
        Math.floor(Math.random() * 3)
      ];

      let title: string;
      let description: string;

      if (venue.category === 'CASINO') {
        title = 'Welcome Bonus';
        description = 'Free £10 gaming credit for new members';
      } else if (venue.category === 'RESTAURANT') {
        title = 'Happy Hour Menu';
        description = 'Special tasting menu available 5-7pm';
      } else {
        title = 'Weekend Special';
        description = '2-for-1 cocktails during happy hour';
      }

      await queryRunner.query(`
        INSERT INTO offers (venue_id, title, description, offer_type, min_busyness, starts_at, ends_at, is_active)
        VALUES ('${venue.id}', '${title}', '${description}', '${offerType}', '${minBusyness}', now(), now() + interval '60 days', true)
      `);
    }

    // Update all existing venues that already have matching images
    await queryRunner.query(`
      UPDATE venues 
      SET image_url = '/images/bar/Albert''s Schloss.jpg'
      WHERE name = 'Albert''s Schloss' AND image_url IS NULL
    `);

    console.log(`✅ Added ${newVenues.length} new venues with images`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove venues added by this migration
    await queryRunner.query(`
      DELETE FROM venues 
      WHERE name IN (
        'Cloud 23', 'NQ64', 'Schofield''s Bar', 'The Edinburgh Castle',
        'Admiral Casino', 'Genting Casino Manchester', 'Grosvenor Casino', 
        'Manchester235 Casino', 'Napoleons Casino Manchester',
        '20 Stories', 'Dishoom', 'Mana', 'Skof', 'The Black Friar'
      )
    `);
  }
}
