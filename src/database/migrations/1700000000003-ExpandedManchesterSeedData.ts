import { MigrationInterface, QueryRunner } from "typeorm";

export class ExpandedManchesterSeedData1700000000003 implements MigrationInterface {
  name = "ExpandedManchesterSeedData1700000000003";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get Manchester city ID
    const manchester = await queryRunner.query(`
      SELECT id FROM cities WHERE name = 'Manchester' AND country_code = 'GB'
    `);

    if (!manchester || manchester.length === 0) {
      throw new Error("Manchester city not found - run base seed first");
    }

    const cityId = manchester[0].id;

    // Add 7 more venues for comprehensive demo
    const newVenues = await queryRunner.query(`
      INSERT INTO venues (city_id, name, category, address, postcode, lat, lng, cover_image_url, description, is_active)
      VALUES
        ('${cityId}', 'Revolution Manchester', 'BAR', 'Parsonage Gardens', 'M3 2HS', 53.4808, -2.2426, null, 'Cocktail bar with DJ sets and party atmosphere', true),
        ('${cityId}', 'The Washhouse', 'BAR', 'Shudehill', 'M4 1EZ', 53.4848, -2.2364, null, 'Hidden speakeasy with craft cocktails', true),
        ('${cityId}', 'Gorilla Bar', 'BAR', 'Whitworth St W', 'M1 5WZ', 53.4742, -2.2394, null, 'Live music venue with late night vibes', true),
        ('${cityId}', 'Impossible Bar', 'BAR', 'Peter St', 'M2 5QR', 53.4775, -2.2445, null, 'Theatrical cocktail experience', true),
        ('${cityId}', 'Factory Manchester', 'CLUB', 'Russell St', 'M1 7SA', 53.4721, -2.2351, null, 'Superclub with world-class DJs', true),
        ('${cityId}', 'Warehouse Project', 'CLUB', 'Trafford Park', 'M17 8AS', 53.4669, -2.3234, null, 'Legendary warehouse club events', true),
        ('${cityId}', 'Hawksmoor Manchester', 'RESTAURANT', 'Deansgate', 'M3 2BW', 53.4794, -2.2493, null, 'Premium steakhouse with cocktail bar', true)
      RETURNING id
    `);

    // Create live states for new venues
    for (const venue of newVenues) {
      await queryRunner.query(`
        INSERT INTO venue_live_state (venue_id, busyness, vibe)
        VALUES ('${venue.id}', 'QUIET', 'CHILL')
        ON CONFLICT (venue_id) DO NOTHING
      `);
    }

    // Add comprehensive vibe schedules for all venues (including original 3)
    const allVenues = await queryRunner.query(`
      SELECT id FROM venues WHERE city_id = '${cityId}'
    `);

    for (const venue of allVenues) {
      // Clear existing schedules
      await queryRunner.query(`
        DELETE FROM venue_vibe_schedule WHERE "venueId" = '${venue.id}'
      `);

      // Add comprehensive weekly schedule
      await queryRunner.query(`
        INSERT INTO venue_vibe_schedule ("venueId", day_of_week, start_time, end_time, vibe, priority, is_active)
        VALUES
          -- Monday (1) - Quiet start
          ('${venue.id}', 1, '17:00', '20:00', 'CHILL', 1, true),
          ('${venue.id}', 1, '20:00', '23:00', 'SOCIAL', 2, true),
          
          -- Tuesday (2) - Similar to Monday
          ('${venue.id}', 2, '17:00', '20:00', 'CHILL', 1, true),
          ('${venue.id}', 2, '20:00', '23:00', 'SOCIAL', 2, true),
          
          -- Wednesday (3) - Mid-week pickup
          ('${venue.id}', 3, '17:00', '19:00', 'CHILL', 1, true),
          ('${venue.id}', 3, '19:00', '22:00', 'SOCIAL', 2, true),
          ('${venue.id}', 3, '22:00', '23:59', 'PARTY', 3, true),
          
          -- Thursday (4) - Pre-weekend energy
          ('${venue.id}', 4, '17:00', '19:00', 'CHILL', 1, true),
          ('${venue.id}', 4, '19:00', '21:00', 'SOCIAL', 2, true),
          ('${venue.id}', 4, '21:00', '23:59', 'PARTY', 3, true),
          
          -- Friday (5) - Full progression
          ('${venue.id}', 5, '17:00', '19:00', 'CHILL', 1, true),
          ('${venue.id}', 5, '19:00', '22:00', 'SOCIAL', 2, true),
          ('${venue.id}', 5, '22:00', '01:00', 'PARTY', 3, true),
          ('${venue.id}', 5, '01:00', '03:00', 'LATE_NIGHT', 4, true),
          
          -- Saturday (6) - Peak night
          ('${venue.id}', 6, '16:00', '19:00', 'CHILL', 1, true),
          ('${venue.id}', 6, '19:00', '21:00', 'SOCIAL', 2, true),
          ('${venue.id}', 6, '21:00', '00:00', 'PARTY', 3, true),
          ('${venue.id}', 6, '00:00', '04:00', 'LATE_NIGHT', 4, true),
          
          -- Sunday (0) - Recovery day
          ('${venue.id}', 0, '12:00', '18:00', 'CHILL', 1, true),
          ('${venue.id}', 0, '18:00', '22:00', 'SOCIAL', 2, true)
      `);
    }

    // Add diverse offers for demo scenarios
    await queryRunner.query(`
      INSERT INTO offers (venue_id, title, description, offer_type, min_busyness, starts_at, ends_at, is_active)
      VALUES
        -- Happy Hour offers (QUIET venues)
        ('${allVenues[0].id}', 'Monday Happy Hour', '2-for-1 cocktails until 8pm', 'BOGO', 'QUIET', now(), now() + interval '30 days', true),
        ('${allVenues[1].id}', 'Weekday Wine Deal', '50% off wine bottles', 'PERCENT_OFF', 'QUIET', now(), now() + interval '30 days', true),
        ('${allVenues[2].id}', 'Early Bird Special', 'Free appetizer with drink', 'FREE_ITEM', 'QUIET', now(), now() + interval '30 days', true),
        
        -- Moderate busyness offers
        ('${allVenues[3].id}', 'Social Hour Cocktails', '£5 signature cocktails', 'HAPPY_HOUR', 'MODERATE', now(), now() + interval '30 days', true),
        ('${allVenues[4].id}', 'Group Discount', '20% off tables of 4+', 'PERCENT_OFF', 'MODERATE', now(), now() + interval '30 days', true),
        
        -- Busy venue premium offers
        ('${allVenues[5].id}', 'VIP Table Service', 'Skip the queue with bottle service', 'ENTRY_DEAL', 'BUSY', now(), now() + interval '30 days', true),
        ('${allVenues[6].id}', 'Premium Experience', 'Complimentary champagne for couples', 'FREE_ITEM', 'BUSY', now(), now() + interval '30 days', true),
        
        -- Weekend specials
        ('${allVenues[7].id}', 'Friday Night Special', 'Free shots with cocktail orders', 'FREE_ITEM', 'MODERATE', now(), now() + interval '30 days', true),
        ('${allVenues[8].id}', 'Saturday Party Package', 'Reserved area + bottle service', 'ENTRY_DEAL', 'BUSY', now(), now() + interval '30 days', true),
        ('${allVenues[9].id}', 'Late Night Fuel', 'Free pizza slice with drinks after midnight', 'FREE_ITEM', 'BUSY', now(), now() + interval '30 days', true)
    `);

    // Add some demo analytics data
    await queryRunner.query(`
      UPDATE offers SET 
        view_count = floor(random() * 100 + 10),
        click_count = floor(random() * 50 + 5),
        redeem_count = floor(random() * 20 + 1)
      WHERE venue_id IN (SELECT id FROM venues WHERE city_id = '${cityId}')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove expanded venues (keep original 3)
    await queryRunner.query(`
      DELETE FROM venues 
      WHERE name IN (
        'Revolution Manchester', 'The Washhouse', 'Gorilla Bar', 
        'Impossible Bar', 'Factory Manchester', 'Warehouse Project', 
        'Hawksmoor Manchester'
      )
    `);
  }
}