/**
 * Mongoose Mock Utilities
 * Provides comprehensive mocking for Mongoose models, queries, and operations
 */

export interface MockMongooseQuery<T = any> {
  populate: jest.MockedFunction<(arg: any) => MockMongooseQuery<T>>;
  select: jest.MockedFunction<(arg: any) => MockMongooseQuery<T>>;
  sort: jest.MockedFunction<(arg: any) => MockMongooseQuery<T>>;
  limit: jest.MockedFunction<(arg: any) => MockMongooseQuery<T>>;
  skip: jest.MockedFunction<(arg: any) => MockMongooseQuery<T>>;
  lean: jest.MockedFunction<(arg?: boolean) => MockMongooseQuery<T>>;
  exec: jest.MockedFunction<() => Promise<T>>;
}

export interface MockMongooseDocument {
  _id: string;
  id?: string;
  save: jest.MockedFunction<() => Promise<any>>;
  toObject?: jest.MockedFunction<() => any>;
  toJSON?: jest.MockedFunction<() => any>;
  [key: string]: any;
}

export interface MockMongooseModel<T = any> {
  // Constructor function properties
  collection: { name: string };
  modelName: string;
  schema: MockMongooseSchema;
  db: MockMongooseDb;

  // Query methods
  findOne: jest.MockedFunction<(filter?: any) => MockMongooseQuery<T | null>>;
  find: jest.MockedFunction<(filter?: any) => MockMongooseQuery<T[]>>;
  findById: jest.MockedFunction<(id: string) => MockMongooseQuery<T | null>>;
  findByIdAndUpdate: jest.MockedFunction<(id: string, update: any, options?: any) => MockMongooseQuery<T | null>>;
  findByIdAndDelete: jest.MockedFunction<(id: string) => MockMongooseQuery<T | null>>;
  findOneAndUpdate: jest.MockedFunction<(filter: any, update: any, options?: any) => MockMongooseQuery<T | null>>;
  findOneAndDelete: jest.MockedFunction<(filter: any) => MockMongooseQuery<T | null>>;
  
  // Bulk operations
  updateMany: jest.MockedFunction<(filter: any, update: any, options?: any) => MockMongooseQuery<any>>;
  deleteMany: jest.MockedFunction<(filter: any) => MockMongooseQuery<any>>;
  insertMany: jest.MockedFunction<(docs: any[], options?: any) => Promise<T[]>>;
  bulkWrite: jest.MockedFunction<(operations: any[]) => Promise<any>>;
  
  // Count and aggregation
  countDocuments: jest.MockedFunction<(filter?: any) => MockMongooseQuery<number>>;
  estimatedDocumentCount: jest.MockedFunction<() => MockMongooseQuery<number>>;
  aggregate: jest.MockedFunction<(pipeline: any[]) => MockMongooseAggregate>;
  
  // Index operations
  createIndexes: jest.MockedFunction<() => Promise<any>>;
  ensureIndexes: jest.MockedFunction<() => Promise<any>>;
  
  // Validation
  validate: jest.MockedFunction<(doc: any) => Promise<any>>;
  
  // Model constructor
  new (doc?: any): MockMongooseDocument;
  (doc?: any): MockMongooseDocument;
}

export interface MockMongooseSchema {
  eachPath: jest.MockedFunction<(callback: (pathname: string, schemaType: any) => void) => void>;
  paths: { [path: string]: any };
}

export interface MockMongooseDb {
  startSession: jest.MockedFunction<() => Promise<MockMongooseSession>>;
  transaction: jest.MockedFunction<(callback: (session: MockMongooseSession) => Promise<any>) => Promise<any>>;
}

export interface MockMongooseSession {
  startTransaction: jest.MockedFunction<() => void>;
  commitTransaction: jest.MockedFunction<() => Promise<void>>;
  abortTransaction: jest.MockedFunction<() => Promise<void>>;
  endSession: jest.MockedFunction<() => Promise<void>>;
}

export interface MockMongooseAggregate {
  exec: jest.MockedFunction<() => Promise<any[]>>;
  allowDiskUse: jest.MockedFunction<(allow: boolean) => MockMongooseAggregate>;
  maxTimeMS: jest.MockedFunction<(ms: number) => MockMongooseAggregate>;
  append: jest.MockedFunction<(...stages: any[]) => MockMongooseAggregate>;
}

/**
 * Mongoose Mock Factory - Creates comprehensive Mongoose mocks
 */
export class MongooseMockFactory {
  /**
   * Creates a mock query with chainable methods
   */
  static createMockQuery<T>(returnValue: T): MockMongooseQuery<T> {
    const mockQuery: MockMongooseQuery<T> = {
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(returnValue),
    };

    return mockQuery;
  }

  /**
   * Creates a mock document with save functionality
   */
  static createMockDocument(data: any = {}): MockMongooseDocument {
    const document: MockMongooseDocument = {
      _id: data._id || 'mock_doc_id',
      ...data,
      save: jest.fn().mockResolvedValue({ _id: data._id || 'mock_doc_id', ...data }),
      toObject: jest.fn().mockReturnValue({ ...data }),
      toJSON: jest.fn().mockReturnValue({ ...data }),
    };

    return document;
  }

  /**
   * Creates a mock session for transaction testing
   */
  static createMockSession(): MockMongooseSession {
    return {
      startTransaction: jest.fn(),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      abortTransaction: jest.fn().mockResolvedValue(undefined),
      endSession: jest.fn().mockResolvedValue(undefined),
    };
  }

  /**
   * Creates a mock aggregate query
   */
  static createMockAggregate(returnValue: any[] = []): MockMongooseAggregate {
    const aggregate: MockMongooseAggregate = {
      exec: jest.fn().mockResolvedValue(returnValue),
      allowDiskUse: jest.fn().mockReturnThis(),
      maxTimeMS: jest.fn().mockReturnThis(),
      append: jest.fn().mockReturnThis(),
    };

    return aggregate;
  }

  /**
   * Creates a comprehensive mock model with all methods
   */
  static createMockModel<T = any>(
    modelName: string = 'TestModel',
    collectionName: string = 'test',
    schemaPaths: string[] = ['_id', '__v', 'name', 'email', 'status', 'createdAt']
  ): MockMongooseModel<T> {
    const mockSession = this.createMockSession();

    // Create schema mock with paths
    const mockSchema: MockMongooseSchema = {
      eachPath: jest.fn((callback: (pathname: string, schemaType: any) => void) => {
        schemaPaths.forEach(path => {
          const schemaType = this.createSchemaType(path);
          callback(path, schemaType);
        });
      }),
      paths: schemaPaths.reduce((acc, path) => {
        acc[path] = this.createSchemaType(path);
        return acc;
      }, {} as { [path: string]: any }),
    };

    const mockDb: MockMongooseDb = {
      startSession: jest.fn().mockResolvedValue(mockSession),
      transaction: jest.fn().mockImplementation(async (callback) => {
        const session = mockSession;
        return await callback(session);
      }),
    };

    // Constructor function for creating documents
    function MockModelConstructor(data: any = {}) {
      return MongooseMockFactory.createMockDocument(data);
    }

    // Add static methods to constructor
    const mockModel = MockModelConstructor as any as MockMongooseModel<T>;

    // Collection info
    mockModel.collection = { name: collectionName };
    mockModel.modelName = modelName;
    mockModel.schema = mockSchema;
    mockModel.db = mockDb;

    // Query methods
    mockModel.findOne = jest.fn(() => this.createMockQuery(null));
    mockModel.find = jest.fn(() => this.createMockQuery([]));
    mockModel.findById = jest.fn(() => this.createMockQuery(null));
    mockModel.findByIdAndUpdate = jest.fn(() => this.createMockQuery(null));
    mockModel.findByIdAndDelete = jest.fn(() => this.createMockQuery(null));
    mockModel.findOneAndUpdate = jest.fn(() => this.createMockQuery(null));
    mockModel.findOneAndDelete = jest.fn(() => this.createMockQuery(null));

    // Bulk operations
    mockModel.updateMany = jest.fn(() => this.createMockQuery({ modifiedCount: 0 }));
    mockModel.deleteMany = jest.fn(() => this.createMockQuery({ deletedCount: 0 }));
    mockModel.insertMany = jest.fn().mockResolvedValue([]);
    mockModel.bulkWrite = jest.fn().mockResolvedValue({});

    // Count and aggregation
    mockModel.countDocuments = jest.fn(() => this.createMockQuery(0));
    mockModel.estimatedDocumentCount = jest.fn(() => this.createMockQuery(0));
    mockModel.aggregate = jest.fn(() => this.createMockAggregate([]));

    // Index operations
    mockModel.createIndexes = jest.fn().mockResolvedValue({});
    mockModel.ensureIndexes = jest.fn().mockResolvedValue({});

    // Validation
    mockModel.validate = jest.fn().mockResolvedValue({});

    return mockModel;
  }

  /**
   * Creates schema type information for a given path
   */
  private static createSchemaType(path: string): any {
    const relationPaths = {
      'profile': { options: { ref: 'Profile' } },
      'business': { options: { ref: 'Business' } },
      'user': { options: { ref: 'User' } },
      'owner': { options: { ref: 'User' } },
      'author': { options: { ref: 'User' } },
      'posts': { options: { type: [{ ref: 'Post' }] } },
      'comments': { options: { type: [{ ref: 'Comment' }] } },
      'files': { options: { type: [{ ref: 'File' }] } },
      'tags': { options: { type: [{ ref: 'Tag' }] } },
      'folder': { options: { ref: 'Folder' } },
      'permissions': { options: { type: [{ ref: 'Permission' }] } },
    };

    return relationPaths[path as keyof typeof relationPaths] || { options: {} };
  }

  /**
   * Creates a repository-specific mock model with common schema
   */
  static createUserModel(): MockMongooseModel {
    return this.createMockModel('User', 'users', [
      '_id', '__v', 'name', 'firstName', 'lastName', 'email', 'status', 'userType',
      'verified', 'phone', 'createdAt', 'updatedAt', 'profile', 'business', 'posts'
    ]);
  }

  static createFileModel(): MockMongooseModel {
    return this.createMockModel('File', 'files', [
      '_id', '__v', 'name', 'originalName', 'mimeType', 'size', 'fileType',
      'userId', 'folderId', 'tags', 'createdAt', 'updatedAt', 'user', 'folder'
    ]);
  }

  static createProfileModel(): MockMongooseModel {
    return this.createMockModel('Profile', 'profiles', [
      '_id', '__v', 'bio', 'avatar', 'userId', 'profileKind', 'user'
    ]);
  }

  static createBusinessModel(): MockMongooseModel {
    return this.createMockModel('Business', 'businesses', [
      '_id', '__v', 'name', 'type', 'ownerId', 'owner', 'contact'
    ]);
  }
}

/**
 * Mock Repository Builder - Fluent interface for building repository mocks
 */
export class MockRepositoryBuilder<T = any> {
  private model: MockMongooseModel<T>;
  private returnValues: { [method: string]: any } = {};

  constructor(modelName: string = 'TestModel', collectionName: string = 'test') {
    this.model = MongooseMockFactory.createMockModel(modelName, collectionName);
  }

  static create<T = any>(modelName?: string, collectionName?: string): MockRepositoryBuilder<T> {
    return new MockRepositoryBuilder<T>(modelName, collectionName);
  }

  /**
   * Configure return values for query methods
   */
  withFindOneResult(result: T | null): MockRepositoryBuilder<T> {
    this.model.findOne.mockReturnValue(MongooseMockFactory.createMockQuery(result));
    return this;
  }

  withFindResult(results: T[]): MockRepositoryBuilder<T> {
    this.model.find.mockReturnValue(MongooseMockFactory.createMockQuery(results));
    return this;
  }

  withFindByIdResult(result: T | null): MockRepositoryBuilder<T> {
    this.model.findById.mockReturnValue(MongooseMockFactory.createMockQuery(result));
    return this;
  }

  withCountResult(count: number): MockRepositoryBuilder<T> {
    this.model.countDocuments.mockReturnValue(MongooseMockFactory.createMockQuery(count));
    return this;
  }

  withAggregateResult(results: any[]): MockRepositoryBuilder<T> {
    this.model.aggregate.mockReturnValue(MongooseMockFactory.createMockAggregate(results));
    return this;
  }

  withInsertManyResult(results: T[]): MockRepositoryBuilder<T> {
    this.model.insertMany.mockResolvedValue(results);
    return this;
  }

  withUpdateResult(result: any): MockRepositoryBuilder<T> {
    this.model.findByIdAndUpdate.mockReturnValue(MongooseMockFactory.createMockQuery(result));
    this.model.updateMany.mockReturnValue(MongooseMockFactory.createMockQuery(result));
    return this;
  }

  withDeleteResult(success: boolean = true): MockRepositoryBuilder<T> {
    const result = success ? { deletedCount: 1 } : { deletedCount: 0 };
    this.model.findByIdAndDelete.mockReturnValue(MongooseMockFactory.createMockQuery(success ? {} : null));
    this.model.deleteMany.mockReturnValue(MongooseMockFactory.createMockQuery(result));
    return this;
  }

  /**
   * Configure error scenarios
   */
  withFindOneError(error: Error): MockRepositoryBuilder<T> {
    const mockQuery = MongooseMockFactory.createMockQuery(null);
    mockQuery.exec.mockRejectedValue(error);
    this.model.findOne.mockReturnValue(mockQuery);
    return this;
  }

  withSaveError(error: Error): MockRepositoryBuilder<T> {
    // Override the constructor to return a document that fails on save
    const originalModel = this.model;
    function FailingMockModel(data: any) {
      const doc = MongooseMockFactory.createMockDocument(data);
      doc.save.mockRejectedValue(error);
      return doc;
    }
    // Copy static methods
    Object.assign(FailingMockModel, originalModel);
    this.model = FailingMockModel as any;
    return this;
  }

  /**
   * Configure complex aggregation results (for pagination)
   */
  withPaginationResult(items: T[], total: number): MockRepositoryBuilder<T> {
    const aggregateResult = [{
      data: items,
      totalCount: [{ count: total }],
    }];
    this.model.aggregate.mockReturnValue(MongooseMockFactory.createMockAggregate(aggregateResult));
    return this;
  }

  /**
   * Reset all mocks to default state
   */
  reset(): MockRepositoryBuilder<T> {
    jest.clearAllMocks();
    // Restore default behaviors
    this.model.findOne.mockReturnValue(MongooseMockFactory.createMockQuery(null));
    this.model.find.mockReturnValue(MongooseMockFactory.createMockQuery([]));
    this.model.countDocuments.mockReturnValue(MongooseMockFactory.createMockQuery(0));
    this.model.aggregate.mockReturnValue(MongooseMockFactory.createMockAggregate([]));
    return this;
  }

  /**
   * Get the built mock model
   */
  build(): MockMongooseModel<T> {
    return this.model;
  }
}