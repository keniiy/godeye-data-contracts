/**
 * Shared Bulk Operations Utility (DRY)
 * Eliminates duplication between Repository and BaseTransactionRepository
 */

import { IBulkOperation, IBulkResult, BulkOperationType } from '../types/response.types';
import { ICriteria } from '../types/repository.types';

export interface IBulkOperationRepository<T> {
  create(data: Partial<T>): Promise<T>;
  update(criteria: ICriteria<T>, data: Partial<T>): Promise<T>;
  delete(criteria: ICriteria<T>): Promise<boolean>;
}

/**
 * Execute bulk operations using any repository implementation
 * @param operations - Array of bulk operations to execute
 * @param repository - Repository instance with create/update/delete methods
 * @returns Promise resolving to bulk operation results
 */
export async function executeBulkOperations<T, R = T>(
  operations: IBulkOperation<T>[],
  repository: IBulkOperationRepository<T>
): Promise<IBulkResult<R>> {
  const results: R[] = [];
  const errors: string[] = [];
  let success_count = 0;
  let error_count = 0;

  for (const operation of operations) {
    try {
      let result: any;

      switch (operation.operation) {
        case BulkOperationType.CREATE:
          result = await repository.create(operation.data);
          break;
        case BulkOperationType.UPDATE:
          if (!operation.where) {
            throw new Error('Update operation requires where clause');
          }
          result = await repository.update(operation.where, operation.data);
          break;
        case BulkOperationType.DELETE:
          if (!operation.where) {
            throw new Error('Delete operation requires where clause');
          }
          result = await repository.delete(operation.where);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation.operation}`);
      }

      results.push(result);
      success_count++;
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      error_count++;
    }
  }

  return {
    success_count,
    error_count,
    results,
    errors,
  };
}