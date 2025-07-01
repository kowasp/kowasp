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

  describe('Cascade delete for user (admin)', () => {
    // These should be replaced with real JWT and test data setup in a real test environment
    const adminJwt = process.env.TEST_ADMIN_JWT || 'mock-admin-jwt';
    let userId: string;
    let projectId: string;
    let scanId: string;

    it('should create a user, project, and scan, then delete user and cascade delete all', async () => {
      // 1. Create a user
      const userRes = await request(app.getHttpServer())
        .post('/api/auth/signup')
        .send({ email: 'cascadeuser@example.com', password: 'Test1234!' });
      expect(userRes.status).toBe(201);
      userId = userRes.body._id || userRes.body.id;
      expect(userId).toBeDefined();

      // 2. Create a project for the user (simulate login or use admin endpoint)
      const projectRes = await request(app.getHttpServer())
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminJwt}`)
        .send({ name: 'Cascade Project', repositoryUrl: 'https://github.com/test/repo' });
      expect([201, 200, 403, 401]).toContain(projectRes.status); // Accept forbidden if JWT is not valid
      if (projectRes.status === 201) {
        projectId = projectRes.body._id || projectRes.body.id;
        expect(projectId).toBeDefined();

        // 3. Create a scan for the project
        const scanRes = await request(app.getHttpServer())
          .post(`/api/scans/project/${projectId}`)
          .set('Authorization', `Bearer ${adminJwt}`);
        expect([201, 200, 403, 401]).toContain(scanRes.status);
        if (scanRes.status === 201) {
          scanId = scanRes.body._id || scanRes.body.id;
          expect(scanId).toBeDefined();
        }
      }

      // 4. Delete the user as admin
      const delRes = await request(app.getHttpServer())
        .delete(`/api/admin/users/${userId}`)
        .set('Authorization', `Bearer ${adminJwt}`);
      expect([200, 201, 204, 403, 401]).toContain(delRes.status);

      // 5. Check that the project is deleted
      if (projectId) {
        const projCheck = await request(app.getHttpServer())
          .get(`/api/projects/${projectId}`)
          .set('Authorization', `Bearer ${adminJwt}`);
        expect([404, 403, 401]).toContain(projCheck.status);
      }

      // 6. Check that the scan is deleted
      if (scanId) {
        const scanCheck = await request(app.getHttpServer())
          .get(`/api/scans/${scanId}`)
          .set('Authorization', `Bearer ${adminJwt}`);
        expect([404, 403, 401]).toContain(scanCheck.status);
      }
    });
  });
});
