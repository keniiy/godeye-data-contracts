/**
 * Custom Jest Matchers
 * Domain-specific assertions for cleaner and more expressive tests
 */

import { IResponse } from '../../types/response.types';
import { ICriteria } from '../../types/repository.types';
import { IKongUserContext } from '../../types/auth.types';

declare global {
  namespace jest {
    interface Matchers<R> {
      // Response matchers
      toBeSuccessResponse(): R;
      toBeErrorResponse(statusCode?: number): R;
      toBePaginatedResponse(): R;
      toHaveResponseData(expectedData: any): R;
      toHaveValidPagination(): R;
      toHaveMetadata(): R;
      
      // Repository/Query matchers
      toBeValidCriteria(): R;
      toHaveRelations(relations: string[]): R;
      toHaveWhereConditions(conditions: any): R;
      toHavePagination(page: number, limit: number): R;
      toHaveSort(sort: { [key: string]: 'ASC' | 'DESC' }): R;
      toHaveSearch(term: string): R;
      
      // Kong Auth matchers
      toBeValidKongContext(): R;
      toHaveUserRole(role: string): R;
      toHaveAllUserRoles(roles: string[]): R;
      toHaveProfile(profileId: string, kind?: string): R;
      
      // Entity matchers
      toBeValidEntity(): R;
      toHaveRequiredFields(fields: string[]): R;
      toHaveRelationData(relationName: string): R;
      toBeActiveEntity(): R;
      toBeDeletedEntity(): R;
      
      // Array/Collection matchers
      toHaveLength(length: number): R;
      toBeNonEmptyArray(): R;
      toContainEntityWithId(id: string): R;
      toAllHaveProperty(property: string): R;
      toAllMatchPredicate(predicate: (item: any) => boolean): R;
      
      // Mock matchers
      toHaveBeenCalledWithCriteria(criteria: Partial<ICriteria<any>>): R;
      toHaveBeenCalledWithPopulate(relations: string[]): R;
      toHaveBeenCalledWithAggregation(): R;
    }
  }
}

/**
 * Response Matchers
 */
export const responseMatchers = {
  toBeSuccessResponse(received: IResponse<any>) {
    const pass = received.success === true && 
                 received.status_code >= 200 && 
                 received.status_code < 300;
    
    return {
      message: () => 
        `expected ${JSON.stringify(received)} to ${pass ? 'not ' : ''}be a success response`,
      pass,
    };
  },

  toBeErrorResponse(received: IResponse<any>, statusCode?: number) {
    const pass = received.success === false && 
                 received.error !== undefined &&
                 (statusCode ? received.status_code === statusCode : received.status_code >= 400);
    
    return {
      message: () => 
        `expected ${JSON.stringify(received)} to ${pass ? 'not ' : ''}be an error response${statusCode ? ` with status ${statusCode}` : ''}`,
      pass,
    };
  },

  toBePaginatedResponse(received: IResponse<any>) {
    const data = received.data as any;
    const pass = received.success === true &&
                 data &&
                 typeof data === 'object' &&
                 Array.isArray(data.items) &&
                 typeof data.total === 'number' &&
                 typeof data.page === 'number' &&
                 typeof data.limit === 'number';
    
    return {
      message: () => 
        `expected ${JSON.stringify(received)} to ${pass ? 'not ' : ''}be a paginated response`,
      pass,
    };
  },

  toHaveResponseData(received: IResponse<any>, expectedData: any) {
    const pass = JSON.stringify(received.data) === JSON.stringify(expectedData);
    
    return {
      message: () => 
        `expected response data to ${pass ? 'not ' : ''}equal ${JSON.stringify(expectedData)}`,
      pass,
    };
  },

  toHaveValidPagination(received: any) {
    const pass = received &&
                 typeof received.total === 'number' &&
                 typeof received.page === 'number' &&
                 typeof received.limit === 'number' &&
                 typeof received.totalPages === 'number' &&
                 typeof received.hasNext === 'boolean' &&
                 typeof received.hasPrev === 'boolean' &&
                 received.page >= 1 &&
                 received.limit > 0 &&
                 received.totalPages >= 1;
    
    return {
      message: () => 
        `expected ${JSON.stringify(received)} to ${pass ? 'not ' : ''}have valid pagination properties`,
      pass,
    };
  },

  toHaveMetadata(received: IResponse<any>) {
    const pass = received.metadata !== undefined && 
                 typeof received.metadata === 'object';
    
    return {
      message: () => 
        `expected response to ${pass ? 'not ' : ''}have metadata`,
      pass,
    };
  },
};

/**
 * Repository/Query Matchers
 */
export const queryMatchers = {
  toBeValidCriteria(received: ICriteria<any>) {
    const pass = received &&
                 typeof received === 'object' &&
                 (received.page === undefined || typeof received.page === 'number') &&
                 (received.limit === undefined || typeof received.limit === 'number');
    
    return {
      message: () => 
        `expected ${JSON.stringify(received)} to ${pass ? 'not ' : ''}be valid criteria`,
      pass,
    };
  },

  toHaveRelations(received: ICriteria<any>, relations: string[]) {
    const pass = received.relations &&
                 Array.isArray(received.relations) &&
                 relations.every(relation => received.relations!.includes(relation));
    
    return {
      message: () => 
        `expected criteria to ${pass ? 'not ' : ''}have relations ${JSON.stringify(relations)}`,
      pass,
    };
  },

  toHaveWhereConditions(received: ICriteria<any>, conditions: any) {
    const pass = received.where &&
                 Object.keys(conditions).every(key => 
                   JSON.stringify(received.where![key]) === JSON.stringify(conditions[key])
                 );
    
    return {
      message: () => 
        `expected criteria to ${pass ? 'not ' : ''}have where conditions ${JSON.stringify(conditions)}`,
      pass,
    };
  },

  toHavePagination(received: ICriteria<any>, page: number, limit: number) {
    const pass = received.page === page && received.limit === limit;
    
    return {
      message: () => 
        `expected criteria to ${pass ? 'not ' : ''}have pagination page=${page}, limit=${limit}`,
      pass,
    };
  },

  toHaveSort(received: ICriteria<any>, sort: { [key: string]: 'ASC' | 'DESC' }) {
    const pass = received.sort &&
                 Object.keys(sort).every(key => received.sort![key] === sort[key]);
    
    return {
      message: () => 
        `expected criteria to ${pass ? 'not ' : ''}have sort ${JSON.stringify(sort)}`,
      pass,
    };
  },

  toHaveSearch(received: ICriteria<any>, term: string) {
    const pass = received.search && received.search.term === term;
    
    return {
      message: () => 
        `expected criteria to ${pass ? 'not ' : ''}have search term "${term}"`,
      pass,
    };
  },
};

/**
 * Kong Auth Matchers
 */
export const authMatchers = {
  toBeValidKongContext(received: IKongUserContext) {
    const pass = received &&
                 typeof received.id === 'string' &&
                 typeof received.email === 'string' &&
                 Array.isArray(received.type) &&
                 received.id.length > 0 &&
                 received.email.includes('@');
    
    return {
      message: () => 
        `expected ${JSON.stringify(received)} to ${pass ? 'not ' : ''}be a valid Kong user context`,
      pass,
    };
  },

  toHaveUserRole(received: IKongUserContext, role: string) {
    const pass = received.type && received.type.includes(role);
    
    return {
      message: () => 
        `expected user to ${pass ? 'not ' : ''}have role "${role}"`,
      pass,
    };
  },

  toHaveAllUserRoles(received: IKongUserContext, roles: string[]) {
    const pass = received.type && 
                 roles.every(role => received.type.includes(role));
    
    return {
      message: () => 
        `expected user to ${pass ? 'not ' : ''}have all roles ${JSON.stringify(roles)}`,
      pass,
    };
  },

  toHaveProfile(received: IKongUserContext, profileId: string, kind?: string) {
    const pass = received.profile_id === profileId &&
                 (!kind || received.profile_kind === kind);
    
    return {
      message: () => 
        `expected user to ${pass ? 'not ' : ''}have profile ID "${profileId}"${kind ? ` with kind "${kind}"` : ''}`,
      pass,
    };
  },
};

/**
 * Entity Matchers
 */
export const entityMatchers = {
  toBeValidEntity(received: any) {
    const pass = received &&
                 typeof received === 'object' &&
                 (received._id || received.id);
    
    return {
      message: () => 
        `expected ${JSON.stringify(received)} to ${pass ? 'not ' : ''}be a valid entity`,
      pass,
    };
  },

  toHaveRequiredFields(received: any, fields: string[]) {
    const pass = received &&
                 fields.every(field => received[field] !== undefined);
    
    return {
      message: () => 
        `expected entity to ${pass ? 'not ' : ''}have required fields ${JSON.stringify(fields)}`,
      pass,
    };
  },

  toHaveRelationData(received: any, relationName: string) {
    const pass = received && 
                 received[relationName] !== undefined &&
                 received[relationName] !== null;
    
    return {
      message: () => 
        `expected entity to ${pass ? 'not ' : ''}have relation data for "${relationName}"`,
      pass,
    };
  },

  toBeActiveEntity(received: any) {
    const pass = received && received.status === 'active';
    
    return {
      message: () => 
        `expected entity to ${pass ? 'not ' : ''}be active`,
      pass,
    };
  },

  toBeDeletedEntity(received: any) {
    const pass = received && received.status === 'deleted';
    
    return {
      message: () => 
        `expected entity to ${pass ? 'not ' : ''}be deleted`,
      pass,
    };
  },
};

/**
 * Array/Collection Matchers
 */
export const collectionMatchers = {
  toBeNonEmptyArray(received: any) {
    const pass = Array.isArray(received) && received.length > 0;
    
    return {
      message: () => 
        `expected ${JSON.stringify(received)} to ${pass ? 'not ' : ''}be a non-empty array`,
      pass,
    };
  },

  toContainEntityWithId(received: any[], id: string) {
    const pass = Array.isArray(received) && 
                 received.some(item => item._id === id || item.id === id);
    
    return {
      message: () => 
        `expected array to ${pass ? 'not ' : ''}contain entity with ID "${id}"`,
      pass,
    };
  },

  toAllHaveProperty(received: any[], property: string) {
    const pass = Array.isArray(received) && 
                 received.every(item => item[property] !== undefined);
    
    return {
      message: () => 
        `expected all items in array to ${pass ? 'not ' : ''}have property "${property}"`,
      pass,
    };
  },

  toAllMatchPredicate(received: any[], predicate: (item: any) => boolean) {
    const pass = Array.isArray(received) && received.every(predicate);
    
    return {
      message: () => 
        `expected all items in array to ${pass ? 'not ' : ''}match the given predicate`,
      pass,
    };
  },
};

/**
 * Mock Matchers
 */
export const mockMatchers = {
  toHaveBeenCalledWithCriteria(received: jest.MockedFunction<any>, criteria: Partial<ICriteria<any>>) {
    const calls = received.mock.calls;
    const pass = calls.some(call => {
      const arg = call[0];
      return arg && 
             Object.keys(criteria).every(key => 
               JSON.stringify(arg[key]) === JSON.stringify(criteria[key as keyof ICriteria<any>])
             );
    });
    
    return {
      message: () => 
        `expected mock to ${pass ? 'not ' : ''}have been called with criteria ${JSON.stringify(criteria)}`,
      pass,
    };
  },

  toHaveBeenCalledWithPopulate(received: jest.MockedFunction<any>, relations: string[]) {
    const calls = received.mock.calls;
    const pass = calls.some(call => {
      const arg = call[0];
      return Array.isArray(arg) && 
             relations.every(relation => 
               arg.includes(relation) || 
               arg.some((item: any) => 
                 typeof item === 'object' && item.path === relation
               )
             );
    });
    
    return {
      message: () => 
        `expected mock to ${pass ? 'not ' : ''}have been called with populate relations ${JSON.stringify(relations)}`,
      pass,
    };
  },

  toHaveBeenCalledWithAggregation(received: jest.MockedFunction<any>) {
    const calls = received.mock.calls;
    const pass = calls.some(call => {
      const arg = call[0];
      return Array.isArray(arg) && 
             arg.some((stage: any) => 
               typeof stage === 'object' && 
               (stage.$match || stage.$group || stage.$sort || stage.$skip || stage.$limit)
             );
    });
    
    return {
      message: () => 
        `expected mock to ${pass ? 'not ' : ''}have been called with aggregation pipeline`,
      pass,
    };
  },
};

/**
 * Register all custom matchers
 */
export function registerCustomMatchers() {
  expect.extend({
    ...responseMatchers,
    ...queryMatchers,
    ...authMatchers,
    ...entityMatchers,
    ...collectionMatchers,
    ...mockMatchers,
  });
}

/**
 * Utility function to register matchers conditionally
 */
export function setupCustomMatchers() {
  if (typeof expect !== 'undefined') {
    registerCustomMatchers();
  }
}