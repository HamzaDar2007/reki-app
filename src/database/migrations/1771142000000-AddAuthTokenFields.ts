import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAuthTokenFields1771142000000 implements MigrationInterface {
  name = 'AddAuthTokenFields1771142000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "refreshToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "passwordResetToken" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "passwordResetExpires" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "passwordResetExpires"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "passwordResetToken"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refreshToken"`);
  }
}
