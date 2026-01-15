import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRekiWeek1Week2Tables1700000000001 implements MigrationInterface {
  name = 'CreateRekiWeek1Week2Tables1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extensions (optional, but useful)
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Enums
    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'venue_category_enum') THEN
          CREATE TYPE venue_category_enum AS ENUM ('BAR', 'CLUB', 'RESTAURANT');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'busyness_level_enum') THEN
          CREATE TYPE busyness_level_enum AS ENUM ('QUIET', 'MODERATE', 'BUSY');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vibe_type_enum') THEN
          CREATE TYPE vibe_type_enum AS ENUM ('CHILL', 'SOCIAL', 'PARTY', 'ROMANTIC', 'LATE_NIGHT');
        END IF;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'offer_type_enum') THEN
          CREATE TYPE offer_type_enum AS ENUM ('PERCENT_OFF', 'BOGO', 'FREE_ITEM', 'HAPPY_HOUR', 'ENTRY_DEAL');
        END IF;
      END $$;
    `);

    // 1) Cities (Week 1 Manchester configuration)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS cities (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        name varchar(120) NOT NULL,
        country_code varchar(2) NOT NULL,
        timezone varchar(64) NOT NULL DEFAULT 'Europe/London',
        is_active boolean NOT NULL DEFAULT true,
        center_lat numeric(9,6),
        center_lng numeric(9,6),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT cities_name_country_unique UNIQUE (name, country_code)
      )
    `);

    // 2) Venues (Week 2 venue data structure)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS venues (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        city_id uuid NOT NULL REFERENCES cities(id) ON DELETE CASCADE,

        name varchar(160) NOT NULL,
        category venue_category_enum NOT NULL,
        address varchar(255),
        postcode varchar(32),

        lat numeric(9,6),
        lng numeric(9,6),

        cover_image_url text,
        description text,

        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_venues_city_id ON venues(city_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_venues_category ON venues(category)`,
    );

    // 3) Venue Live State (Week 2: busyness + vibe, UI-independent)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS venue_live_state (
        venue_id uuid PRIMARY KEY REFERENCES venues(id) ON DELETE CASCADE,
        busyness busyness_level_enum NOT NULL DEFAULT 'QUIET',
        vibe vibe_type_enum NOT NULL DEFAULT 'CHILL',
        busyness_updated_at timestamptz NOT NULL DEFAULT now(),
        vibe_updated_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    // 4) Vibe Scheduling (Week 2: time-based vibe logic)
    // "day_of_week": 0=Sunday ... 6=Saturday
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS venue_vibe_schedule (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
        day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        start_time time NOT NULL,
        end_time time NOT NULL,
        vibe vibe_type_enum NOT NULL,
        priority smallint NOT NULL DEFAULT 0,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT vibe_schedule_time_range CHECK (end_time > start_time)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_vibe_schedule_venue_day ON venue_vibe_schedule(venue_id, day_of_week)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_vibe_schedule_active ON venue_vibe_schedule(is_active)`,
    );

    // 5) Offers (Week 2: offer rules & availability)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS offers (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,

        title varchar(160) NOT NULL,
        description text,
        offer_type offer_type_enum NOT NULL,

        -- Rule: Only show if busyness >= this
        min_busyness busyness_level_enum NOT NULL DEFAULT 'QUIET',

        -- Availability window (simple and demo-friendly)
        starts_at timestamptz NOT NULL,
        ends_at timestamptz NOT NULL,

        is_active boolean NOT NULL DEFAULT true,

        -- Simulated counters (Week 4 would expand, but Week 2 can store basic demo counters)
        view_count integer NOT NULL DEFAULT 0,
        click_count integer NOT NULL DEFAULT 0,
        redeem_count integer NOT NULL DEFAULT 0,

        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),

        CONSTRAINT offers_time_range CHECK (ends_at > starts_at)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_offers_venue_id ON offers(venue_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_offers_active ON offers(is_active)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_offers_time ON offers(starts_at, ends_at)`,
    );

    // 6) Optional: Offer redemptions (SIMULATED demo, no auth required)
    // This is useful for demo stability and testing.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS offer_redemptions (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        offer_id uuid NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
        venue_id uuid NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
        redeemed_at timestamptz NOT NULL DEFAULT now(),
        source varchar(32) NOT NULL DEFAULT 'DEMO'
      )
    `);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_redemptions_offer_id ON offer_redemptions(offer_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_redemptions_venue_id ON offer_redemptions(venue_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS offer_redemptions`);
    await queryRunner.query(`DROP TABLE IF EXISTS offers`);
    await queryRunner.query(`DROP TABLE IF EXISTS venue_vibe_schedule`);
    await queryRunner.query(`DROP TABLE IF EXISTS venue_live_state`);
    await queryRunner.query(`DROP TABLE IF EXISTS venues`);
    await queryRunner.query(`DROP TABLE IF EXISTS cities`);

    await queryRunner.query(`DROP TYPE IF EXISTS offer_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS vibe_type_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS busyness_level_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS venue_category_enum`);
  }
}
