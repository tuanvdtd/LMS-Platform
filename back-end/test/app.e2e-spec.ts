import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from './../src/app.module.js';
import { setupApp } from './../src/setup-app.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication({ bodyParser: false });
    setupApp(app);
    await app.init();
  });

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });

  // Filter của Sentry không được đổi response trả client.
  it('/api/debug-sentry (GET) → 500 mặc định của Nest', () => {
    return request(app.getHttpServer())
      .get('/api/debug-sentry')
      .expect(500)
      .expect({ statusCode: 500, message: 'Internal server error' });
  });

  afterEach(async () => {
    await app.close();
  });
});
