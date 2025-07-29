/**
 * GOD-EYE Application Bootstrap
 * One-line setup for standardized NestJS microservice configuration
 */

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe as GodsEyeValidationPipe } from '../core/validation';

export interface BootstrapOptions {
  module: any;
  appName: string;
  port?: number;
  globalPrefix?: string;
  enableSwagger?: boolean;
  enableCors?: boolean;
}

export async function bootstrapGodsEyeApp(options: BootstrapOptions): Promise<void> {
  const logger = new Logger('Bootstrap');
  
  try {
    const app = await NestFactory.create(options.module);
    
    if (options.globalPrefix) {
      app.setGlobalPrefix(options.globalPrefix);
    }
    
    if (options.enableCors !== false) {
      app.enableCors({ origin: true, credentials: true });
    }
    
    app.useGlobalPipes(new GodsEyeValidationPipe());
    
    if (options.enableSwagger !== false) {
      const config = new DocumentBuilder()
        .setTitle(`${options.appName} API`)
        .setDescription(`${options.appName} microservice built with GOD-EYE Data Contracts`)
        .setVersion('1.0.0')
        .addBearerAuth()
        .build();
      
      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document);
    }
    
    const port = options.port ?? 3000;
    await app.listen(port);
    
    logger.log(`🚀 ${options.appName} running on: http://localhost:${port}`);
    
  } catch (error) {
    logger.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
}
