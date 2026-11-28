import './env.js';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupApp } from './setup-app.js';
import { setupDocs } from './setup-docs.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  setupApp(app);
  setupDocs(app);
  await app.listen(process.env.PORT ?? 4000);
}
await bootstrap();
