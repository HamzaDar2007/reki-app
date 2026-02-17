// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ValidationPipe } from '@nestjs/common';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

// async function bootstrap() {
//   console.log('1. Starting bootstrap...');
//   const app = await NestFactory.create(AppModule);
//   console.log('2. App created successfully');

//   // CORS Configuration
//   app.enableCors({
//     origin: [
//       'http://localhost:3000',
//       'http://localhost:3001',
//       'http://localhost:8100',
//       'http://18.171.182.71:3000',
//       'http://18.171.182.71',
//     ],
//     methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
//     credentials: true,
//   });

//   // Global Validation Pipe
//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       forbidNonWhitelisted: true,
//       transform: true,
//       transformOptions: {
//         enableImplicitConversion: true,
//       },
//     }),
//   );

//   // Global Exception Filter
//   app.useGlobalFilters(new GlobalExceptionFilter());

//   // Swagger Configuration
//   const config = new DocumentBuilder()
//     .setTitle('REKI MVP API')
//     .setDescription(
//       'Manchester venue discovery & offers API - Week 1-4 Complete Implementation. ' +
//         'Real-world business logic for busyness, vibe scheduling, and offer management.\n\n' +
//         '## Getting Started\n' +
//         '1. Register a new user: `POST /users/register`\n' +
//         '2. Login to get JWT token: `POST /users/login`\n' +
//         '3. Use the token in Authorization header: `Bearer <your-token>`\n' +
//         '4. Explore venues: `GET /venues?cityId=<manchester-city-id>`\n' +
//         '5. Check offers: `GET /offers?venueId=<venue-id>`\n\n' +
//         '## Demo Data\n' +
//         'The API comes pre-loaded with Manchester venues and sample offers. ' +
//         'Use the demo endpoints to simulate different scenarios.',
//     )
//     .setVersion('1.0.0')
//     .addBearerAuth()
//     .addTag('auth', 'User authentication')
//     .addTag('users', 'User profile & preferences')
//     .addTag('cities', 'Manchester city configuration')
//     .addTag('venues', 'Venue discovery & live state')
//     .addTag('offers', 'Venue offers & redemption')
//     .addTag('notifications', 'User notifications')
//     .addTag('automation', 'Time-based automation & demo scenarios')
//     .addTag('analytics', 'Venue owner & platform analytics')
//     .addTag('demo', 'Demo simulation scenarios')
//     .addServer('http://localhost:3000', 'Development server')
//     .addServer('http://18.171.182.71:3000', 'Production Server')
//     .build();

//   const document = SwaggerModule.createDocument(app, config);
//   SwaggerModule.setup('api', app, document);
//   console.log('3. Swagger configured');

//   const port = process.env.PORT || 3000;
//   console.log(`4. About to listen on port ${port}...`);
//   await app.listen(port);
//   console.log('5. Server listening!');

//   console.log(`
// ╔════════════════════════════════════════════════════════════╗
// ║          🚀 REKI MVP API - Week 1-6 Complete
// ╠════════════════════════════════════════════════════════════╣
// ║  API Server:     http://localhost:${port}
// ║  Swagger Docs:   http://localhost:${port}/api
// ║  Environment:    ${process.env.NODE_ENV || 'development'}
// ║  Demo Mode:      ${process.env.DEMO_MODE === 'true' ? 'Enabled' : 'Disabled'}
// ║  Demo City:      ${process.env.DEMO_CITY || 'Manchester'}
// ╚════════════════════════════════════════════════════════════╝
//   `);
// }

// bootstrap().catch((error) => {
//   console.error('❌ Failed to start server:');
//   console.error(error);
//   process.exit(1);
// });
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  console.log('1. Starting bootstrap...');
  const app = await NestFactory.create(AppModule);
  console.log('2. App created successfully');

  // Determine environment
  const isProduction = process.env.NODE_ENV === 'production';
  const port = process.env.PORT || 3000;

  // --- DYNAMIC CORS CONFIGURATION ---
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8100',
      'http://18.171.182.71', // Production IP
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  // --- DYNAMIC SWAGGER CONFIGURATION ---
  const configBuilder = new DocumentBuilder()
    .setTitle('REKI MVP API')
    .setDescription('Manchester venue discovery & offers API implementation.')
    .setVersion('1.0.0')
    .addBearerAuth();

  // Add servers based on environment
  if (isProduction) {
    // On the live server, we use the IP.
    // We omit :3000 so it goes through Nginx (Port 80)
    configBuilder.addServer('http://18.171.182.71', 'Production Server');
  } else {
    configBuilder.addServer(`http://localhost:${port}`, 'Local Development');
  }

  const config = configBuilder.build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  console.log('3. Swagger configured');

  // Use '0.0.0.0' for the live server to accept external requests
  await app.listen(port, '0.0.0.0');
  console.log(`4. Server listening on port ${port}!`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});
