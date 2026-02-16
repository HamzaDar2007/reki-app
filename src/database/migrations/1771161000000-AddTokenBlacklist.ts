import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenBlacklist1771161000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "token_blacklist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3e37528d03f0bd5335874afa48d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8c2ca80e62a4a178870aa9e7a0" ON "token_blacklist" ("token") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_8c2ca80e62a4a178870aa9e7a0"`);
        await queryRunner.query(`DROP TABLE "token_blacklist"`);
    }
}
