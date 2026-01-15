import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVenueOwner1768412173209 implements MigrationInterface {
  name = 'AddVenueOwner1768412173209';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "venue_vibe_schedule" DROP CONSTRAINT "FK_a7fbcc79ff37ee57058e3c3076c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer_redemptions" DROP CONSTRAINT "FK_a233b4e28f1832eb62fbfe206b7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer_redemptions" DROP CONSTRAINT "FK_c6a4da5b5b49722004a7178267d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_710149dbe5c315f74033701543"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bb28c67fad9c46fac68d84a8ae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "venue_vibe_schedule" RENAME COLUMN "venueId" TO "venue_id"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_preferences_minbusyness_enum" AS ENUM('QUIET', 'MODERATE', 'BUSY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_preferences" ("user_id" uuid NOT NULL, "preferredCategories" text, "minBusyness" "public"."user_preferences_minbusyness_enum", "preferredVibes" text, CONSTRAINT "PK_458057fa75b66e68a275647da2e" PRIMARY KEY ("user_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "preferencesUserId" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "REL_e7728d83d3d1e8f110ab618370" UNIQUE ("preferencesUserId"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer_redemptions" DROP COLUMN "offerId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer_redemptions" DROP COLUMN "venueId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer_redemptions" ADD "offer_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer_redemptions" ADD "venue_id" uuid`,
    );
    await queryRunner.query(`ALTER TABLE "venues" ADD "owner_id" uuid`);
    await queryRunner.query(
      `CREATE INDEX "IDX_d3c14feacd62255a1aa4f4e624" ON "venue_vibe_schedule" ("is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1eebeca128a9c6e0aca2b96de2" ON "venue_vibe_schedule" ("venue_id", "day_of_week") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ccc05c510834178775281530fe" ON "offer_redemptions" ("offer_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_df60822a24259d56dc5db9f605" ON "offer_redemptions" ("venue_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3c97c6007b187566562b9b47f7" ON "offers" ("venue_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3362bb8271fabb5ba2ea82f5c2" ON "offers" ("is_active") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c2ab6dcc752b5c95b2baefb41c" ON "venues" ("city_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8cb5cf3df16fc75663f85b5b35" ON "venues" ("owner_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "venue_vibe_schedule" ADD CONSTRAINT "FK_91d7a632b5499665927544506ce" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer_redemptions" ADD CONSTRAINT "FK_ccc05c510834178775281530feb" FOREIGN KEY ("offer_id") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer_redemptions" ADD CONSTRAINT "FK_df60822a24259d56dc5db9f6057" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preferences" ADD CONSTRAINT "FK_458057fa75b66e68a275647da2e" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_e7728d83d3d1e8f110ab6183705" FOREIGN KEY ("preferencesUserId") REFERENCES "user_preferences"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "venues" ADD CONSTRAINT "FK_8cb5cf3df16fc75663f85b5b35c" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "venues" DROP CONSTRAINT "FK_8cb5cf3df16fc75663f85b5b35c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_e7728d83d3d1e8f110ab6183705"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_preferences" DROP CONSTRAINT "FK_458057fa75b66e68a275647da2e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer_redemptions" DROP CONSTRAINT "FK_df60822a24259d56dc5db9f6057"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer_redemptions" DROP CONSTRAINT "FK_ccc05c510834178775281530feb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "venue_vibe_schedule" DROP CONSTRAINT "FK_91d7a632b5499665927544506ce"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_8cb5cf3df16fc75663f85b5b35"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_c2ab6dcc752b5c95b2baefb41c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3362bb8271fabb5ba2ea82f5c2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3c97c6007b187566562b9b47f7"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_df60822a24259d56dc5db9f605"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ccc05c510834178775281530fe"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1eebeca128a9c6e0aca2b96de2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_d3c14feacd62255a1aa4f4e624"`,
    );
    await queryRunner.query(`ALTER TABLE "venues" DROP COLUMN "owner_id"`);
    await queryRunner.query(
      `ALTER TABLE "offer_redemptions" DROP COLUMN "venue_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer_redemptions" DROP COLUMN "offer_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer_redemptions" ADD "venueId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer_redemptions" ADD "offerId" uuid`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "user_preferences"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_preferences_minbusyness_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "venue_vibe_schedule" RENAME COLUMN "venue_id" TO "venueId"`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bb28c67fad9c46fac68d84a8ae" ON "venues" ("name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_710149dbe5c315f74033701543" ON "venue_vibe_schedule" ("day_of_week", "venueId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "offer_redemptions" ADD CONSTRAINT "FK_c6a4da5b5b49722004a7178267d" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "offer_redemptions" ADD CONSTRAINT "FK_a233b4e28f1832eb62fbfe206b7" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "venue_vibe_schedule" ADD CONSTRAINT "FK_a7fbcc79ff37ee57058e3c3076c" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
