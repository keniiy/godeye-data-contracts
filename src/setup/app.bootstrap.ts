/**
 * GOD-EYE Application Bootstrap
 * One-line setup for standardized NestJS microservice configuration
 */

import { NestFactory } from '@nestjs/core';
import { Logger, INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe as GodsEyeValidationPipe } from '../core/validation';

/**
 * Bootstrap configuration options
 */
export interface BootstrapConfig {
  serviceName: string;
  port?: number;
  globalPrefix?: string;
  enableSwagger?: boolean;
  corsEnabled?: boolean;
  swagger?: {
    enabled?: boolean;
    title?: string;
    description?: string;
    version?: string;
    path?: string;
    customOptions?: any;
  };
  cors?: {
    enabled?: boolean;
    origins?: string[];
    credentials?: boolean;
  };
  validation?: {
    whitelist?: boolean;
    forbidNonWhitelisted?: boolean;
    transform?: boolean;
  };
  beforeStart?: (app: INestApplication) => Promise<void> | void;
}

/**
 * Bootstrap a GOD-EYE microservice with standardized configuration
 * 
 * @param appModule - The root application module
 * @param config - Bootstrap configuration options
 * @returns Promise<INestApplication> - The configured NestJS application
 */
export async function bootstrap(
  appModule: any, 
  config: BootstrapConfig
): Promise<INestApplication> {
  const logger = new Logger('GOD-EYE Bootstrap');
  
  try {
    const app = await NestFactory.create(appModule);
    
    // Set global prefix
    if (config.globalPrefix) {
      app.setGlobalPrefix(config.globalPrefix);
    }
    
    // Configure CORS
    const corsEnabled = config.corsEnabled ?? config.cors?.enabled ?? true;
    if (corsEnabled) {
      const corsOptions = {
        origin: config.cors?.origins || true,
        credentials: config.cors?.credentials ?? true
      };
      app.enableCors(corsOptions);
    }
    
    // Configure global validation pipe
    const validationOptions = {
      whitelist: config.validation?.whitelist ?? true,
      forbidNonWhitelisted: config.validation?.forbidNonWhitelisted ?? true,
      transform: config.validation?.transform ?? true
    };
    app.useGlobalPipes(new GodsEyeValidationPipe(validationOptions));
    
    // Configure Swagger documentation
    const swaggerEnabled = config.enableSwagger ?? config.swagger?.enabled ?? true;
    if (swaggerEnabled) {
      const swaggerConfig = new DocumentBuilder()
        .setTitle(config.swagger?.title || `${config.serviceName} API`)
        .setDescription(
          config.swagger?.description || 
          `${config.serviceName} microservice built with GOD-EYE Data Contracts`
        )
        .setVersion(config.swagger?.version || '1.0.0')
        .addBearerAuth()
        .build();
      
      const document = SwaggerModule.createDocument(app, swaggerConfig);
      const swaggerPath = config.swagger?.path || 'docs';
      SwaggerModule.setup(swaggerPath, app, document, config.swagger?.customOptions);
      
      logger.log(`📚 Swagger documentation available at: http://localhost:${config.port || 3000}/${swaggerPath}`);
    }
    
    // Execute custom beforeStart hook
    if (config.beforeStart) {
      await config.beforeStart(app);
    }
    
    // Start the application
    const port = config.port ?? 3000;
    await app.listen(port);
    
    logger.log(`🚀 ${config.serviceName} service running on: http://localhost:${port}`);
    if (config.globalPrefix) {
      logger.log(`🌐 API available at: http://localhost:${port}/${config.globalPrefix}`);
    }
    
    return app;
    
  } catch (error) {
    logger.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

/**
 * Legacy bootstrap function for backward compatibility
 * @deprecated Use bootstrap() instead
 */
export async function bootstrapGodsEyeApp(options: {
  module: any;
  appName: string;
  port?: number;
  globalPrefix?: string;
  enableSwagger?: boolean;
  enableCors?: boolean;
}): Promise<void> {
  const logger = new Logger('Bootstrap (Legacy)');
  logger.warn('⚠️ bootstrapGodsEyeApp is deprecated. Use bootstrap() instead.');
  
  await bootstrap(options.module, {
    serviceName: options.appName,
    port: options.port,
    globalPrefix: options.globalPrefix,
    enableSwagger: options.enableSwagger,
    corsEnabled: options.enableCors
  });
}
