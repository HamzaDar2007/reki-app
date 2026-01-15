import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET / (health check)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        const body = res.body as Record<string, any>;
        if (!body.status) {
          throw new Error('Missing status field');
        }
        if (!body.message) {
          throw new Error('Missing message field');
        }
        if (body.status !== 'ok') {
          throw new Error('Status should be ok');
        }
      });
  });

  it('GET /health (health status)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        const body = res.body as Record<string, any>;
        if (!body.status) {
          throw new Error('Missing status field');
        }
        if (!body.timestamp) {
          throw new Error('Missing timestamp field');
        }
        if (!body.version) {
          throw new Error('Missing version field');
        }
        if (!body.uptime && body.uptime !== 0) {
          throw new Error('Missing uptime field');
        }
        if (!body.environment) {
          throw new Error('Missing environment field');
        }
        if (body.status !== 'ok') {
          throw new Error('Status should be ok');
        }
      });
  });
});
