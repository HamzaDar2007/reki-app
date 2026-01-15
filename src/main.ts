import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS Configuration
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8100',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global Exception Filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('REKI MVP API')
    .setDescription(
      'Manchester venue discovery & offers API - Week 1-4 Complete Implementation. ' +
        'Real-world business logic for busyness, vibe scheduling, and offer management.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('auth', 'User authentication')
    .addTag('users', 'User profile & preferences')
    .addTag('cities', 'Manchester city configuration')
    .addTag('venues', 'Venue discovery & live state')
    .addTag('offers', 'Venue offers & redemption')
    .addTag('notifications', 'User notifications')
    .addTag('demo', 'Demo simulation scenarios')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
╔════════════════════════════════════════════════════════════╗
║          🚀 REKI MVP API - Week 1-4 Complete            ║
╠════════════════════════════════════════════════════════════╣
║  API Server:     http://localhost:${port}
║  Swagger Docs:   http://localhost:${port}/api
║  Environment:    ${process.env.NODE_ENV || 'development'}
║  Demo Mode:      ${process.env.DEMO_MODE === 'true' ? 'Enabled' : 'Disabled'}
║  Demo City:      ${process.env.DEMO_CITY || 'Manchester'}
╚════════════════════════════════════════════════════════════╝
  `);
}
void bootstrap();
