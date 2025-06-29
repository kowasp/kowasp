import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors(); // Enable CORS for all origins
  await app.listen(3001, () => {
    console.log('Server is running on http://localhost:3001/api');
  });
}
bootstrap();
