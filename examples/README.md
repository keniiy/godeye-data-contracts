# ICriteria Usage Examples

This folder contains comprehensive examples of how to use the universal `ICriteria<T>` interface with GOD-EYE data contracts.

## 📁 Examples Structure

- **`basic-icriteria-usage.ts`** - Simple ICriteria examples
- **`controller-examples.ts`** - NestJS controller patterns  
- **`dto-usage.ts`** - Query DTO patterns and transformations
- **`advanced-queries.ts`** - Complex query patterns
- **`pagination-examples.ts`** - Pagination with ICriteria

## 🚀 Quick Start

```typescript
import { ICriteria, BaseTypeORMRepository } from '@kenniy/godeye-data-contracts';

// Universal interface works with ANY entity
const criteria: ICriteria<User> = {
  where: { status: 'active' },
  relations: ['profile', 'business'],
  sort: { createdAt: 'DESC' },
  limit: 20,
  page: 1
};

const users = await userRepository.findWithPagination(criteria);
```

## 🎯 Key Concepts

### Universal ICriteria
- **Works with any entity** - User, File, Business, etc.
- **Auto-applies all fields** - where, relations, sort, pagination
- **Type-safe** - Full TypeScript support
- **ORM-agnostic** - Same interface for TypeORM and Mongoose

### Query DTOs
- **HTTP-friendly** - Transform URL params to ICriteria
- **Validation** - Built-in class-validator support  
- **Extensible** - Entity-specific DTOs extend base
- **Auto-transformation** - Clean conversion to ICriteria

## 📖 Browse Examples

Each example file shows different usage patterns with detailed comments and real-world scenarios.