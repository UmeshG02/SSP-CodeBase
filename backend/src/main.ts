import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

const server = express();

async function createServer(expressInstance: any) {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressInstance));

  // Enable CORS
  app.enableCors({
    origin: '*', // For development, allow all origins
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger integration
  const config = new DocumentBuilder()
    .setTitle('SSP CodeBase API')
    .setDescription('The API documentation for the SSP CodeBase practice platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.init();
  return app;
}

// Vercel serverless function entry
let appInstance: any;
export default async (req: any, res: any) => {
  if (!appInstance) {
    appInstance = await createServer(server);
  }
  return server(req, res);
};

// For local running
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const port = process.env.PORT ?? 3001;
  createServer(server).then((app) => {
    app.listen(port).then(() => {
      console.log(`🚀 SSP CodeBase Backend is running on: http://localhost:${port}`);
      console.log(`📄 API Documentation available at: http://localhost:${port}/api/docs`);
    });
  });
}

