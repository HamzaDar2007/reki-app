import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'reki-db-new',
  synchronize: false, // Always false in production
  logging: process.env.TYPEORM_LOGGING === 'true',
  entities: [
    'src/modules/**/*.entity{.ts,.js}',
    'src/**/*.entity{.ts,.js}'
  ],
  migrations: ['src/database/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
});