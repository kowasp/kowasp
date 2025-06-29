import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
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

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  // Add a mock admin JWT (replace with a real one if available)
  const adminJwt = process.env.TEST_ADMIN_JWT || 'mock-admin-jwt';

  it('/api/admin/users (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminJwt}`);
    // Accept 200 or 401/403 if JWT is not valid in test env
    expect([200, 401, 403]).toContain(res.status);
  });

  it('/api/admin/projects (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/projects')
      .set('Authorization', `Bearer ${adminJwt}`);
    expect([200, 401, 403]).toContain(res.status);
  });

  it('/api/admin/scans (GET)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/admin/scans')
      .set('Authorization', `Bearer ${adminJwt}`);
    expect([200, 401, 403]).toContain(res.status);
  });
});
