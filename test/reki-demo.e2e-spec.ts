import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Investor Demo (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let venueId: string;
  let offerId: string;

  beforeAll(async () => {
    // Set JWT_SECRET explicitly to ensure consistency across modules
    process.env.JWT_SECRET = 'your_super_secret_jwt_key';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // Ensure DB is connected for data cleanup if needed
  });

  afterAll(async () => {
    await app.close();
  });

  let cityId: string;

  it('Step 1: Register and Login a new user', async () => {
    const email = `investor_${Date.now()}@test.com`;
    const password = 'Password123!';

    // Register
    await request(app.getHttpServer())
      .post('/users/register')
      .send({ email, password })
      .expect(201);

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/users/login')
      .send({ email, password })
      .expect(201);

    accessToken = (loginRes.body as Record<string, any>).access_token;
    expect(accessToken).toBeDefined();
  });

  it('Step 2: City Discovery - Get Manchester', async () => {
    const res = await request(app.getHttpServer()).get('/cities').expect(200);

    const body = res.body as any[];
    const manchester = body.find(
      (c: Record<string, any>) => c.name === 'Manchester',
    );
    expect(manchester).toBeDefined();
    cityId = (manchester as Record<string, any>).id as string;
  });

  it('Step 3: Venue Discovery - Find venues', async () => {
    const res = await request(app.getHttpServer())
      .get(`/venues?cityId=${cityId}`)
      .expect(200);

    const body = res.body as any[];
    expect(body.length).toBeGreaterThan(0);
    venueId = body[0].id;
  });

  it('Step 4: Trigger Friday Night Scenario (Busy + Notifications)', async () => {
    const res = await request(app.getHttpServer())
      .post('/demo/friday-evening')
      .expect(201);

    expect((res.body as Record<string, any>).message).toContain(
      'Friday evening simulation applied',
    );
  });

  it('Step 5: Check Simulated Notifications', async () => {
    const res = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect((res.body as any[]).length).toBeGreaterThan(0);
    // Any notification is fine for demo
  });

  it('Step 6: View Venue Details (Verify Busy State)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/venues/${venueId}`)
      .expect(200);

    const body = res.body as Record<string, any>;
    // The API flattens liveState into busyness/vibe
    expect(body.busyness).toBe('BUSY');
    expect(body.vibe).toBe('PARTY');
  });

  it('Step 7: View and Redeem Offer', async () => {
    // Get offers for venue
    const offersRes = await request(app.getHttpServer())
      .get(`/offers?venueId=${venueId}`)
      .expect(200);

    const body = offersRes.body as any[];
    if (body.length > 0) {
      offerId = (body[0] as Record<string, any>).id as string;

      // Redeem
      await request(app.getHttpServer())
        .post('/offers/redeem')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ offerId })
        .expect(201);
    }
  });

  it('Step 8: Reset Demo state', async () => {
    await request(app.getHttpServer()).post('/demo/reset').expect(201);
  });
});
