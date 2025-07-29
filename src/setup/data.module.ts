/**
 * GOD-EYE Data Module
 * Simple setup for unified repository system across all microservices
 */

import { Module, DynamicModule } from '@nestjs/common';
import { ResponseFactory } from '../core/response';
import { ValidationPipe } from '../core/validation';

export interface DataModuleOptions {
  /** Enable automatic validation pipe */
  enableValidation?: boolean;
  
  /** Enable response factory as global provider */
  enableResponseFactory?: boolean;
}

/**
 * GOD-EYE Data Module
 * 
 * Simple setup for validation and response factory
 * Note: Use Repository classes directly in your services instead of complex DI
 * 
 * @example
 * ```typescript
 * @Module({
 *   imports: [DataModule.forRoot({ enableValidation: true })]
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class DataModule {
  static forRoot(options: DataModuleOptions = {}): DynamicModule {
    const providers: any[] = [];
    
    // Add ResponseFactory if enabled (default: true)
    if (options.enableResponseFactory !== false) {
      providers.push({
        provide: ResponseFactory,
        useValue: ResponseFactory,
      });
    }
    
    // Add ValidationPipe if enabled (default: true)
    if (options.enableValidation !== false) {
      providers.push({
        provide: 'APP_PIPE',
        useClass: ValidationPipe,
      });
    }
    
    return {
      module: DataModule,
      providers,
      exports: providers,
      global: true,
    };
  }
}