import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedManchesterDemoData1700000000002 implements MigrationInterface {
  name = 'SeedManchesterDemoData1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) Insert Manchester
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

    // 2) Insert sample venues (demo-friendly, can rename later)
    const venues = (await queryRunner.query(`
      INSERT INTO venues (city_id, name, category, address, postcode, lat, lng, cover_image_url, description, is_active)
      VALUES
        ('${cityId}', 'The Alchemist', 'BAR', 'Spinningfields, Manchester', 'M3', 53.4797, -2.2520, null, 'Cocktail bar with live vibe', true),
        ('${cityId}', 'Albert''s Schloss', 'BAR', 'Peter St, Manchester', 'M2', 53.4774, -2.2452, null, 'Beer hall + late-night energy', true),
        ('${cityId}', 'Northern Monk', 'BAR', 'Hatch, Oxford Rd', 'M1', 53.4713, -2.2366, null, 'Chill craft beer spot', true)
      RETURNING id
    `)) as { id: string }[];

    // 3) Create initial live states
    for (const v of venues) {
      await queryRunner.query(`
        INSERT INTO venue_live_state (venue_id, busyness, vibe)
        VALUES ('${v.id}', 'QUIET', 'CHILL')
        ON CONFLICT (venue_id) DO NOTHING
      `);
    }

    // 4) Seed vibe schedules (simple and believable)
    // Friday (5) and Saturday (6): Chill -> Social -> Party -> Late Night
    for (const v of venues) {
      await queryRunner.query(`
        INSERT INTO venue_vibe_schedule (venue_id, day_of_week, start_time, end_time, vibe, priority, is_active)
        VALUES
          ('${v.id}', 5, '17:00', '19:00', 'CHILL', 1, true),
          ('${v.id}', 5, '19:00', '22:00', 'SOCIAL', 2, true),
          ('${v.id}', 5, '22:00', '23:59', 'PARTY', 3, true),

          ('${v.id}', 6, '16:00', '19:00', 'CHILL', 1, true),
          ('${v.id}', 6, '19:00', '22:00', 'SOCIAL', 2, true),
          ('${v.id}', 6, '22:00', '23:59', 'LATE_NIGHT', 3, true)
      `);
    }

    // 5) Seed offers (time windows)
    // NOTE: adjust the dates anytime; for demos, you can set them to NOW..NOW+7days
    await queryRunner.query(`
      INSERT INTO offers (venue_id, title, description, offer_type, min_busyness, starts_at, ends_at, is_active)
      VALUES
        ('${venues[0].id}', '50% Off House Lagers', 'Valid during busy hours', 'PERCENT_OFF', 'MODERATE', now(), now() + interval '7 days', true),
        ('${venues[1].id}', 'Free Cocktail Changing Drink', 'Limited-time demo offer', 'FREE_ITEM', 'BUSY', now(), now() + interval '7 days', true),
        ('${venues[2].id}', 'Happy Hour 2-for-1', 'Early evening deal', 'HAPPY_HOUR', 'QUIET', now(), now() + interval '7 days', true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // delete by city name to keep it safe
    await queryRunner.query(`
      DELETE FROM cities WHERE name = 'Manchester' AND country_code = 'GB'
    `);
  }
}
