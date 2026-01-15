import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'reki_db',
  logging: process.env.TYPEORM_LOGGING === 'true',
}));

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  demoMode: process.env.DEMO_MODE === 'true',
  demoCity: process.env.DEMO_CITY || 'Manchester',
}));
