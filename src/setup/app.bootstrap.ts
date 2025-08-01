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
    docUrl?: string;
    maxDisplayRequestSize?: number;
    maxDisplayResponseSize?: number;
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
      let swaggerConfigBuilder = new DocumentBuilder()
        .setTitle(config.swagger?.title || `${config.serviceName} API`)
        .setDescription(
          config.swagger?.description || 
          `${config.serviceName} microservice built with GOD-EYE Data Contracts`
        )
        .setVersion(config.swagger?.version || '1.0.0')
        .addBearerAuth();

      // Add external documentation URL if provided
      if (config.swagger?.docUrl) {
        swaggerConfigBuilder = swaggerConfigBuilder.setExternalDoc('External Documentation', config.swagger.docUrl);
      }

      const swaggerConfig = swaggerConfigBuilder.build();
      
      const document = SwaggerModule.createDocument(app, swaggerConfig);
      const swaggerPath = config.swagger?.path || 'docs';
      
      // Enhanced Swagger UI options with increased limits and better UX
      const swaggerOptions = {
        swaggerOptions: {
          maxDisplayRequestSize: config.swagger?.maxDisplayRequestSize || 10000,
          maxDisplayResponseSize: config.swagger?.maxDisplayResponseSize || 10000,
          docExpansion: 'list',     // Show endpoints collapsed
          filter: true,             // Enable search
          showRequestHeaders: true, // Show request headers
          deepLinking: true,        // Enable deep linking
          displayRequestDuration: true, // Show request duration
          tryItOutEnabled: true,    // Enable try it out by default
          supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'], // Enable all methods
          requestInterceptor: undefined, // Allow request interception
          responseInterceptor: undefined, // Allow response interception
        },
        customCss: `
          .swagger-ui .topbar { display: none; }
          .swagger-ui .info { margin: 20px 0; }
          .swagger-ui .scheme-container { margin: 20px 0; }
          .swagger-ui .opblock .opblock-summary { cursor: pointer; }
          .swagger-ui .parameters-col_description p,
          .swagger-ui .parameters-col_description div { 
            max-height: 200px; 
            overflow-y: auto; 
            word-break: break-word;
          }
          .swagger-ui .response-col_description { 
            max-height: 300px; 
            overflow-y: auto; 
          }
          .swagger-ui .model-box { 
            max-height: 400px; 
            overflow-y: auto; 
          }
        `,
        customSiteTitle: `${config.serviceName} API Documentation`,
        ...config.swagger?.customOptions
      };
      
      SwaggerModule.setup(swaggerPath, app, document, swaggerOptions);
      
      logger.log(`📚 Swagger documentation available at: http://localhost:${config.port || 3000}/${swaggerPath}`);
      if (config.swagger?.docUrl) {
        logger.log(`📖 External documentation: ${config.swagger.docUrl}`);
      }
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
