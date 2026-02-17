import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCasinoToVenueCategory1771200050000 implements MigrationInterface {
  name = 'AddCasinoToVenueCategory1771200050000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the transaction is active before committing
    if (queryRunner.isTransactionActive) {
      await queryRunner.commitTransaction();
    }
    
    // Add CASINO to the venue_category_enum if it doesn't exist
    // This must be done outside of a transaction
    await queryRunner.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'CASINO' 
          AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'venue_category_enum'
          )
        ) THEN
          ALTER TYPE venue_category_enum ADD VALUE 'CASINO';
        END IF;
      END $$;
    `);
    
    // Start new transaction for subsequent migrations
    await queryRunner.startTransaction();
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Note: PostgreSQL doesn't support removing enum values directly
    // Would need to recreate the enum type to remove CASINO
    console.log('Cannot directly remove enum value in PostgreSQL');
  }
}
