import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserFullNameAndPhone1771805000000 implements MigrationInterface {
  name = 'AddUserFullNameAndPhone1771805000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ADD COLUMN "full_name" character varying(160),
      ADD COLUMN "phone" character varying(32)
    `);

    await queryRunner.query(`
      UPDATE "users"
      SET
        "full_name" = COALESCE("full_name", split_part("email", '@', 1)),
        "phone" = COALESCE("phone", '0000000000')
    `);

    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "full_name" SET NOT NULL,
      ALTER COLUMN "phone" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      DROP COLUMN "phone",
      DROP COLUMN "full_name"
    `);
  }
}
