import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVenueImages1771200000000 implements MigrationInterface {
  name = 'AddVenueImages1771200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE venues 
      ADD COLUMN IF NOT EXISTS image_url TEXT,
      ADD COLUMN IF NOT EXISTS gallery_images TEXT[],
      ADD COLUMN IF NOT EXISTS logo_url TEXT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE venues 
      DROP COLUMN IF EXISTS image_url,
      DROP COLUMN IF EXISTS gallery_images,
      DROP COLUMN IF EXISTS logo_url
    `);
  }
}
