import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotificationPreferences1771146400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add notification preference columns to user_preferences table
    await queryRunner.query(`
      ALTER TABLE "user_preferences" 
      ADD COLUMN IF NOT EXISTS "notifications_enabled" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      ALTER TABLE "user_preferences" 
      ADD COLUMN IF NOT EXISTS "email_notifications" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      ALTER TABLE "user_preferences" 
      ADD COLUMN IF NOT EXISTS "offer_notifications" boolean NOT NULL DEFAULT true
    `);

    await queryRunner.query(`
      ALTER TABLE "user_preferences" 
      ADD COLUMN IF NOT EXISTS "busyness_notifications" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove notification preference columns
    await queryRunner.query(`
      ALTER TABLE "user_preferences" 
      DROP COLUMN IF EXISTS "busyness_notifications"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_preferences" 
      DROP COLUMN IF EXISTS "offer_notifications"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_preferences" 
      DROP COLUMN IF EXISTS "email_notifications"
    `);

    await queryRunner.query(`
      ALTER TABLE "user_preferences" 
      DROP COLUMN IF EXISTS "notifications_enabled"
    `);
  }
}
