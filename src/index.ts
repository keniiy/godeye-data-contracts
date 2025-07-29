/**
 * @kenniy/godeye-data-contracts v1.0.0
 * 
 * Microsoft-grade base repository architecture for GOD-EYE microservices
 * Zero runtime overhead with maximum code reuse
 */

// ============================================================================
// CORE EXPORTS - Base Repository Architecture
// ============================================================================

// Base Repository Classes - Zero overhead inheritance
export { BaseTypeORMRepository } from './repositories/base-typeorm.repository';

// Types & Constants - Complete type safety  
export * from './types';


// ============================================================================
// OPTIONAL EXPORTS - Additional utilities
// ============================================================================

// Response System utilities
export { ResponseFactory } from './core/response';