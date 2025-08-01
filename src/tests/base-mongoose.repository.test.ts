/**
 * Base Mongoose Repository Tests
 * Tests the MongoDB repository functionality with mocked Mongoose models
 */

import { BaseMongooseRepository } from '../repositories/base-mongoose.repository';
import { ICriteria } from '../types/repository.types';

// Mock Mongoose Document interface
interface MockDocument {
  _id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'deleted';
  createdAt: Date;
  profile?: any;
  business?: any;
}

// Mock Mongoose Model - create as constructor function
function MockModel(data: any) {
  return {
    ...data,
    save: jest.fn().mockResolvedValue({ _id: '123', ...data, createdAt: new Date() })
  };
}

// Add static methods
MockModel.collection = { name: 'users' };
MockModel.findOne = jest.fn();
MockModel.find = jest.fn();
MockModel.countDocuments = jest.fn();
MockModel.insertMany = jest.fn();
MockModel.findByIdAndUpdate = jest.fn();
MockModel.updateMany = jest.fn();
MockModel.findByIdAndDelete = jest.fn();
MockModel.aggregate = jest.fn();
MockModel.db = {
  startSession: jest.fn()
};

// Mock schema for auto-discovery
const mockSchemaPath = (pathname: string, schemaType: any) => {
  const paths = {
    '_id': { options: {} },
    '__v': { options: {} }, 
    'name': { options: {} },
    'email': { options: {} },
    'status': { options: {} },
    'createdAt': { options: {} },
    'profile': { options: { ref: 'Profile' } },
    'business': { options: { ref: 'Business' } },
    'posts': { options: { type: [{ ref: 'Post' }] } },
    'files': { options: { type: [{ ref: 'File' }] } },
    'owner': { options: { ref: 'User' } },
    'permissions': { options: { type: [{ ref: 'Permission' }] } },
    'very': { options: { ref: 'Very' } }
  };
  
  return paths[pathname as keyof typeof paths] || { options: {} };
};

MockModel.schema = {
  eachPath: jest.fn((callback: (pathname: string, schemaType: any) => void) => {
    const paths = ['_id', '__v', 'name', 'email', 'status', 'createdAt', 'profile', 'business', 'posts', 'files', 'owner', 'permissions', 'very'];
    paths.forEach(path => {
      callback(path, mockSchemaPath(path, null));
    });
  })
};

// Mock Query object with chainable methods
const createMockQuery = (returnValue: any) => ({
  populate: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue(returnValue)
});

// Test Repository Implementation  
class TestMongooseRepository extends BaseMongooseRepository<any> {
  constructor() {
    super(MockModel as any);
  }
}

describe('BaseMongooseRepository', () => {
  let repository: TestMongooseRepository;

  beforeEach(() => {
    repository = new TestMongooseRepository();
    jest.clearAllMocks();
    // Reset the relation cache for each test
    (repository as any).relationCache = null;
  });

  describe('findOne', () => {
    it('should find single document with basic criteria', async () => {
      const mockUser = { _id: '123', name: 'John', email: 'john@example.com', status: 'active' as const, createdAt: new Date() };
      const mockQuery = createMockQuery(mockUser);
      MockModel.findOne.mockReturnValue(mockQuery);

      const criteria: ICriteria<MockDocument> = {
        where: { _id: '123' }
      };

      const result = await repository.findOne(criteria);

      expect(MockModel.findOne).toHaveBeenCalledWith({ _id: '123' });
      expect(result).toEqual(mockUser);
    });

    it('should apply relations (populate)', async () => {
      const mockUser = { _id: '123', name: 'John', email: 'john@example.com', status: 'active' as const, createdAt: new Date() };
      const mockQuery = createMockQuery(mockUser);
      MockModel.findOne.mockReturnValue(mockQuery);

      const criteria: ICriteria<MockDocument> = {
        where: { _id: '123' },
        relations: ['profile', 'business']
      };

      await repository.findOne(criteria);

      expect(mockQuery.populate).toHaveBeenCalledWith(['profile', 'business']);
    });

    it('should apply deep relations with nested populate', async () => {
      const mockUser = { _id: '123', name: 'John', email: 'john@example.com', status: 'active' as const, createdAt: new Date() };
      const mockQuery = createMockQuery(mockUser);
      MockModel.findOne.mockReturnValue(mockQuery);

      const criteria: ICriteria<MockDocument> = {
        where: { _id: '123' },
        relations: ['profile', 'business.owner', 'posts.comments.author']
      };

      await repository.findOne(criteria);

      // Should call populate with structured populate options
      const expectedPopulateOptions = [
        'profile',
        { path: 'business', populate: { path: 'owner' } },
        { path: 'posts', populate: { path: 'comments', populate: { path: 'author' } } }
      ];

      expect(mockQuery.populate).toHaveBeenCalledWith(expectedPopulateOptions);
    });

    it('should handle overlapping deep relations efficiently', async () => {
      const mockUser = { _id: '123', name: 'John', email: 'john@example.com', status: 'active' as const, createdAt: new Date() };
      const mockQuery = createMockQuery(mockUser);
      MockModel.findOne.mockReturnValue(mockQuery);

      const criteria: ICriteria<MockDocument> = {
        where: { _id: '123' },
        relations: ['business.owner', 'business.contact', 'business.owner.profile']
      };

      await repository.findOne(criteria);

      // Current implementation creates separate populate objects (can be optimized later)
      const expectedPopulateOptions = [
        { path: 'business', populate: { path: 'owner' } },
        { path: 'business', populate: { path: 'contact' } },
        { path: 'business', populate: { path: 'owner', populate: { path: 'profile' } } }
      ];

      expect(mockQuery.populate).toHaveBeenCalledWith(expectedPopulateOptions);
    });

    it('should build deep populate options correctly', async () => {
      const mockUser = { _id: '123', name: 'John', email: 'john@example.com', status: 'active' as const, createdAt: new Date() };
      const mockQuery = createMockQuery(mockUser);
      MockModel.findOne.mockReturnValue(mockQuery);

      const criteria: ICriteria<MockDocument> = {
        where: { _id: '123' },
        relations: ['very.deep.nested.relation']
      };

      await repository.findOne(criteria);

      const expectedPopulateOptions = [
        { 
          path: 'very', 
          populate: { 
            path: 'deep', 
            populate: { 
              path: 'nested', 
              populate: { path: 'relation' } 
            } 
          } 
        }
      ];

      expect(mockQuery.populate).toHaveBeenCalledWith(expectedPopulateOptions);
    });

    it('should apply field selection', async () => {
      const mockUser = { _id: '123', name: 'John', email: 'john@example.com', status: 'active' as const, createdAt: new Date() };
      const mockQuery = createMockQuery(mockUser);
      MockModel.findOne.mockReturnValue(mockQuery);

      const criteria: ICriteria<MockDocument> = {
        where: { _id: '123' },
        select: ['name', 'email']
      };

      await repository.findOne(criteria);

      expect(mockQuery.select).toHaveBeenCalledWith('name email');
    });
  });

  describe('find', () => {
    it('should find multiple documents', async () => {
      const mockUsers = [
        { _id: '123', name: 'John', email: 'john@example.com', status: 'active' as const, createdAt: new Date() },
        { _id: '124', name: 'Jane', email: 'jane@example.com', status: 'active' as const, createdAt: new Date() }
      ];
      const mockQuery = createMockQuery(mockUsers);
      MockModel.find.mockReturnValue(mockQuery);

      const criteria: ICriteria<MockDocument> = {
        where: { status: 'active' }
      };

      const result = await repository.find(criteria);

      expect(MockModel.find).toHaveBeenCalledWith({ status: 'active' });
      expect(result).toEqual(mockUsers);
    });

    it('should apply sorting with proper format conversion', async () => {
      const mockUsers = [{ _id: '123', name: 'John', email: 'john@example.com', status: 'active' as const, createdAt: new Date() }];
      const mockQuery = createMockQuery(mockUsers);
      MockModel.find.mockReturnValue(mockQuery);

      const criteria: ICriteria<MockDocument> = {
        sort: { createdAt: 'DESC', name: 'ASC' }
      };

      await repository.find(criteria);

      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1, name: 1 });
    });

    it('should apply limit with maximum enforcement', async () => {
      const mockUsers = [{ _id: '123', name: 'John', email: 'john@example.com', status: 'active' as const, createdAt: new Date() }];
      const mockQuery = createMockQuery(mockUsers);
      MockModel.find.mockReturnValue(mockQuery);

      const criteria: ICriteria<MockDocument> = {
        limit: 50
      };

      await repository.find(criteria);

      expect(mockQuery.limit).toHaveBeenCalledWith(50);
    });

    it('should enforce maximum limit (1000)', async () => {
      const mockUsers = [{ _id: '123', name: 'John', email: 'john@example.com', status: 'active' as const, createdAt: new Date() }];
      const mockQuery = createMockQuery(mockUsers);
      MockModel.find.mockReturnValue(mockQuery);

      const criteria: ICriteria<MockDocument> = {
        limit: 2000 // Exceeds maximum
      };

      await repository.find(criteria);

      expect(mockQuery.limit).toHaveBeenCalledWith(1000); // Capped at maximum
    });
  });

  describe('findWithPagination', () => {
    it('should return paginated results using aggregation', async () => {
      const mockAggregateResult = [{
        data: [
          { _id: '123', name: 'John', email: 'john@example.com', status: 'active' as const, createdAt: new Date() },
          { _id: '124', name: 'Jane', email: 'jane@example.com', status: 'active' as const, createdAt: new Date() }
        ],
        totalCount: [{ count: 10 }]
      }];

      const mockAggregateQuery = {
        exec: jest.fn().mockResolvedValue(mockAggregateResult)
      };
      MockModel.aggregate.mockReturnValue(mockAggregateQuery);

      const criteria: ICriteria<MockDocument> = {
        page: 2,
        limit: 2,
        where: { status: 'active' }
      };

      const result = await repository.findWithPagination(criteria);

      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(10);
      expect(result.page).toBe(2);
      expect(result.limit).toBe(2);
      expect(result.totalPages).toBe(5);
      expect(result.hasNext).toBe(true);
      expect(result.hasPrev).toBe(true);
    });

    it('should handle search criteria in aggregation', async () => {
      const mockAggregateResult = [{
        data: [{ _id: '123', name: 'John Doe', email: 'john@example.com', status: 'active' as const, createdAt: new Date() }],
        totalCount: [{ count: 1 }]
      }];

      const mockAggregateQuery = {
        exec: jest.fn().mockResolvedValue(mockAggregateResult)
      };
      MockModel.aggregate.mockReturnValue(mockAggregateQuery);

      const criteria: ICriteria<MockDocument> = {
        page: 1,
        limit: 10,
        search: {
          term: 'john'
          // Backend auto-determines fields
        }
      };

      await repository.findWithPagination(criteria);

      // Verify aggregation pipeline was called
      expect(MockModel.aggregate).toHaveBeenCalled();
      const pipeline = MockModel.aggregate.mock.calls[0][0];
      
      // Should contain search match stage
      const searchStage = pipeline.find((stage: any) => stage.$match && stage.$match.$or);
      expect(searchStage).toBeDefined();
      expect(searchStage.$match.$or).toEqual([
        { name: { $regex: 'john', $options: 'i' } },
        { title: { $regex: 'john', $options: 'i' } },
        { description: { $regex: 'john', $options: 'i' } },
        { email: { $regex: 'john', $options: 'i' } }
      ]);
    });
  });

  describe('count', () => {
    it('should count documents with criteria', async () => {
      const mockCountQuery = {
        exec: jest.fn().mockResolvedValue(5)
      };
      MockModel.countDocuments.mockReturnValue(mockCountQuery);

      const criteria: ICriteria<MockDocument> = {
        where: { status: 'active' }
      };

      const result = await repository.count(criteria);

      expect(MockModel.countDocuments).toHaveBeenCalledWith({ status: 'active' });
      expect(result).toBe(5);
    });

    it('should count all documents when no criteria provided', async () => {
      const mockCountQuery = {
        exec: jest.fn().mockResolvedValue(10)
      };
      MockModel.countDocuments.mockReturnValue(mockCountQuery);

      const result = await repository.count();

      expect(MockModel.countDocuments).toHaveBeenCalledWith({});
      expect(result).toBe(10);
    });
  });

  describe('findById', () => {
    it('should find document by ID', async () => {
      const mockUser = { _id: '123', name: 'John', email: 'john@example.com', status: 'active' as const, createdAt: new Date() };
      const mockQuery = createMockQuery([mockUser]); // Return as array since find() returns array
      MockModel.find.mockReturnValue(mockQuery);

      const whereConfig = { conditions: { status: 'active' } };
      const queryDto = { toICriteria: () => ({ relations: [] }) };
      
      const result = await repository.findById('123', whereConfig, queryDto);

      expect(result.data).toEqual(mockUser);
    });

    it('should find document by ID with relations', async () => {
      const mockUser = { _id: '123', name: 'John', email: 'john@example.com', status: 'active' as const, createdAt: new Date() };
      const mockQuery = createMockQuery([mockUser]); // Return as array since find() returns array
      MockModel.find.mockReturnValue(mockQuery);

      const whereConfig = { conditions: { status: 'active' } };
      const queryDto = { toICriteria: () => ({ relations: ['profile', 'business'] }) };
      
      await repository.findById('123', whereConfig, queryDto);

      // The buildDeepPopulateOptions method processes relations individually, returning arrays
      expect(mockQuery.populate).toHaveBeenCalledWith(['profile']);
      expect(mockQuery.populate).toHaveBeenCalledWith(['business']);
    });
  });

  describe('create', () => {
    it('should create new document', async () => {
      const userData = { name: 'John', email: 'john@example.com', status: 'active' as const };
      const savedUser = { _id: '123', ...userData, createdAt: new Date() };

      // MockModel constructor is already set up to return a document with save method
      // The save method in MockModel returns { _id: '123', ...data, createdAt: new Date() }
      
      const result = await repository.create(userData);

      // The result should be the saved document
      expect(result._id).toBe('123');
      expect(result.name).toBe('John');
      expect(result.email).toBe('john@example.com');
      expect(result.status).toBe('active');
    });
  });

  describe('createMany', () => {
    it('should create multiple documents', async () => {
      const usersData = [
        { name: 'John', email: 'john@example.com', status: 'active' as const },
        { name: 'Jane', email: 'jane@example.com', status: 'active' as const }
      ];
      const savedUsers = usersData.map((user, index) => ({ _id: `12${index}`, ...user, createdAt: new Date() }));

      MockModel.insertMany.mockResolvedValue(savedUsers);

      const result = await repository.createMany(usersData);

      expect(MockModel.insertMany).toHaveBeenCalledWith(usersData, {
        ordered: false,
        rawResult: false
      });
      expect(result).toEqual(savedUsers);
    });
  });

  describe('updateById', () => {
    it('should update document by ID', async () => {
      const updateData = { name: 'John Updated' };
      const updatedUser = { _id: '123', name: 'John Updated', email: 'john@example.com', status: 'active' as const, createdAt: new Date() };

      const mockUpdateQuery = {
        exec: jest.fn().mockResolvedValue(updatedUser)
      };
      MockModel.findByIdAndUpdate.mockReturnValue(mockUpdateQuery);

      const result = await repository.updateById('123', updateData);

      expect(MockModel.findByIdAndUpdate).toHaveBeenCalledWith('123', updateData, {
        new: true,
        runValidators: true,
        lean: false
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('updateMany', () => {
    it('should update multiple documents', async () => {
      const criteria = { status: 'inactive' };
      const updateData = { status: 'active' };
      const updateResult = { modifiedCount: 3 };

      const mockUpdateQuery = {
        exec: jest.fn().mockResolvedValue(updateResult)
      };
      MockModel.updateMany.mockReturnValue(mockUpdateQuery);

      const result = await repository.updateMany({ where: criteria }, updateData);

      expect(MockModel.updateMany).toHaveBeenCalledWith(criteria, updateData, {
        runValidators: true
      });
      expect(result.modifiedCount).toBe(3);
    });
  });

  describe('deleteById', () => {
    it('should delete document by ID and return true', async () => {
      const deletedUser = { _id: '123', name: 'John', email: 'john@example.com', status: 'active' as const, createdAt: new Date() };

      const mockDeleteQuery = {
        exec: jest.fn().mockResolvedValue(deletedUser)
      };
      MockModel.findByIdAndDelete.mockReturnValue(mockDeleteQuery);

      const result = await repository.deleteById('123');

      expect(MockModel.findByIdAndDelete).toHaveBeenCalledWith('123');
      expect(result).toBe(true);
    });

    it('should return false when document not found', async () => {
      const mockDeleteQuery = {
        exec: jest.fn().mockResolvedValue(null)
      };
      MockModel.findByIdAndDelete.mockReturnValue(mockDeleteQuery);

      const result = await repository.deleteById('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('aggregate', () => {
    it('should execute aggregation pipeline', async () => {
      const pipeline = [
        { $match: { status: 'active' } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ];
      const mockResult = [{ _id: 'active', count: 5 }];

      const mockAggregateQuery = {
        exec: jest.fn().mockResolvedValue(mockResult)
      };
      MockModel.aggregate.mockReturnValue(mockAggregateQuery);

      const result = await repository.aggregate(pipeline);

      expect(MockModel.aggregate).toHaveBeenCalledWith(pipeline, {
        allowDiskUse: true,
        maxTimeMS: 30000
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('error handling', () => {
    it('should handle findOne errors properly', async () => {
      const error = new Error('Database connection failed');
      const mockQuery = {
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        exec: jest.fn().mockRejectedValue(error)
      };
      MockModel.findOne.mockReturnValue(mockQuery);

      await expect(repository.findOne({ where: { _id: '123' } })).rejects.toThrow('Database connection failed');
    });

    it('should handle create errors properly', async () => {
      const error = new Error('Validation failed');
      
      // Override the MockModel constructor temporarily to return a document that fails on save
      const originalMockModel = MockModel;
      function FailingMockModel(data: any) {
        return {
          ...data,
          save: jest.fn().mockRejectedValue(error)
        };
      }
      
      // Update repository model temporarily
      (repository as any).model = FailingMockModel;

      await expect(repository.create({ name: 'Invalid' })).rejects.toThrow('Validation failed');
      
      // Restore original model
      (repository as any).model = originalMockModel;
    });
  });

  describe('Auto-Discovery', () => {
    beforeEach(() => {
      // Reset relation cache for fresh tests
      (repository as any).relationCache = null;
    });

    it('should auto-discover model relations from Mongoose schema', () => {
      const relations = (repository as any).getEntityRelations();
      
      expect(relations).toEqual([
        'profile',
        'business', 
        'posts',
        'files',
        'owner',
        'permissions',
        'very'
      ]);
    });

    it('should filter out invalid relations and log warnings', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const mockQuery = createMockQuery([]);
      MockModel.findOne.mockReturnValue(mockQuery);

      await repository.findOne({
        relations: ['profile', 'invalidRelation', 'business', 'anotherInvalid']
      });

      // Should log warning for invalid relations in the new format
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("⚠️ Unknown relations for users: invalidRelation, anotherInvalid\n📋 Available:")
      );

      consoleSpy.mockRestore();
    });

    it('should validate deep relation paths correctly', () => {
      expect((repository as any).isValidRelationPath('profile')).toBe(true);
      // business.owner should be true since 'business' is a valid root relation
      expect((repository as any).isValidRelationPath('business.owner')).toBe(true);
      expect((repository as any).isValidRelationPath('invalidRelation')).toBe(false);
      // invalid.deep should be false since 'invalid' is not a valid root relation  
      expect((repository as any).isValidRelationPath('invalid.deep')).toBe(false);
    });

    it('should cache relations for performance', () => {
      // First call
      const relations1 = (repository as any).getEntityRelations();
      
      // Second call should use cache
      const relations2 = (repository as any).getEntityRelations();
      
      expect(relations1).toEqual(relations2);
      expect(relations1).toBe(relations2); // Same reference due to caching
    });

    it('should handle auto-discovery errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Create a new repository instance to avoid cached relations
      const brokenModel = { 
        ...MockModel,
        schema: null,
        collection: { name: 'broken_test' },
        modelName: 'BrokenTestModel'
      };
      const brokenRepository = new (class extends BaseMongooseRepository<any> {
        constructor() {
          super(brokenModel as any);
        }
      })();
      
      const relations = (brokenRepository as any).getEntityRelations();
      
      expect(relations).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Could not auto-discover relations"),
        expect.anything()
      );
      
      consoleSpy.mockRestore();
    });
  });
});