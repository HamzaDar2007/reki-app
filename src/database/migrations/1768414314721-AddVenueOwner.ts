import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVenueOwner1768414314721 implements MigrationInterface {
  name = 'AddVenueOwner1768414314721';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "venues" DROP CONSTRAINT "FK_8cb5cf3df16fc75663f85b5b35c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "venues" ADD CONSTRAINT "FK_8cb5cf3df16fc75663f85b5b35c" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "venues" DROP CONSTRAINT "FK_8cb5cf3df16fc75663f85b5b35c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "venues" ADD CONSTRAINT "FK_8cb5cf3df16fc75663f85b5b35c" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
