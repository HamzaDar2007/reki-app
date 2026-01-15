import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationsTable1768457114642 implements MigrationInterface {
  name = 'AddNotificationsTable1768457114642';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('OFFER_AVAILABLE', 'BUSYNESS_UPDATE', 'SYSTEM')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "title" character varying(160) NOT NULL, "message" text NOT NULL, "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'SYSTEM', "is_read" boolean NOT NULL DEFAULT false, "metadata" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_9a8a82462cab47c73d25f49261" ON "notifications" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_9a8a82462cab47c73d25f49261f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_9a8a82462cab47c73d25f49261"`,
    );
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
  }
}
