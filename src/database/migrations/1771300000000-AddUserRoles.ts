import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserRoles1771300000000 implements MigrationInterface {
  name = 'AddUserRoles1771300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for user roles (TypeORM expects users_role_enum)
    await queryRunner.query(`
      CREATE TYPE "users_role_enum" AS ENUM('USER', 'BUSINESS', 'ADMIN')
    `);

    // Add role column to users table with default value 'USER'
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "role" "users_role_enum" NOT NULL DEFAULT 'USER'
    `);

    // Update existing users who own venues to BUSINESS role
    await queryRunner.query(`
      UPDATE "users" 
      SET "role" = 'BUSINESS' 
      WHERE "id" IN (
        SELECT DISTINCT "owner_id" 
        FROM "venues" 
        WHERE "owner_id" IS NOT NULL
      )
    `);

    console.log('✅ User roles added successfully');
    console.log('✅ Existing venue owners updated to BUSINESS role');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove role column
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "role"
    `);

    // Drop enum type
    await queryRunner.query(`
      DROP TYPE "users_role_enum"
    `);
  }
}
