import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

dotenv.config();
const port = Number(process.env.PORT) || 3000;

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.enableCors();
  app.setGlobalPrefix('api2');

  try {
    await app.listen(port);
    console.log(`Example app listening at http://localhost:${port}`);
  } catch (error) {
    console.error(`An error occurred while app starting: ${error}`);
  }
}

bootstrap();
