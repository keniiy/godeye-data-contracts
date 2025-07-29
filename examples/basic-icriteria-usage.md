# Basic ICriteria Usage Examples

This guide shows the fundamental patterns for using the universal `ICriteria<T>` interface across different entities and use cases.

## Entity Interfaces (Example)

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'inactive';
  userType: 'business' | 'individual';
  verified: boolean;
  createdAt: Date;
  profile?: UserProfile;
  business?: Business;
}

interface UserProfile {
  id: string;
  bio: string;
  avatar: string;
}

interface File {
  id: string;
  name: string;
  size: number;
  userId: string;
  status: 'active' | 'deleted';
}
```

## Basic ICriteria Examples

### 1. Simple Find with Where Clause

```typescript
async function findActiveUsers(userRepo: BaseTypeORMRepository<User>) {
  const criteria: ICriteria<User> = {
    where: { status: 'active' }
  };

  const users = await userRepo.find(criteria);
  return users;
}
```

### 2. Find with Relations (Populate)

```typescript
async function findUsersWithProfile(userRepo: BaseTypeORMRepository<User>) {
  const criteria: ICriteria<User> = {
    where: { status: 'active' },
    relations: ['profile'] // Auto-populates profile relation
  };

  const users = await userRepo.find(criteria);
  return users;
}
```

### 3. Complex Where Conditions

```typescript
async function findBusinessUsers(userRepo: BaseTypeORMRepository<User>) {
  const criteria: ICriteria<User> = {
    where: {
      status: 'active',
      userType: 'business',
      verified: true
    },
    relations: ['profile', 'business'], // Multiple relations
    sort: { createdAt: 'DESC' }         // Sort by creation date
  };

  const users = await userRepo.find(criteria);
  return users;
}
```

### 4. Pagination with ICriteria

```typescript
async function getPaginatedUsers(userRepo: BaseTypeORMRepository<User>) {
  const criteria: ICriteria<User> = {
    where: { status: 'active' },
    relations: ['profile'],
    sort: { name: 'ASC' },
    page: 1,      // Page number (1-based)
    limit: 20     // Items per page
  };

  const result = await userRepo.findWithPagination(criteria);

  // Returns: { items: User[], total: number, page: number, limit: number, ... }
  return result;
}
```

### 5. Field Selection (Optimize Performance)

```typescript
async function getUserNamesOnly(userRepo: BaseTypeORMRepository<User>) {
  const criteria: ICriteria<User> = {
    where: { status: 'active' },
    select: ['id', 'name', 'email'], // Only return these fields
    sort: { name: 'ASC' },
    limit: 100
  };

  const users = await userRepo.find(criteria);
  return users;
}
```

### 6. Search Functionality

```typescript
async function searchUsers(userRepo: BaseTypeORMRepository<User>, searchTerm: string) {
  const criteria: ICriteria<User> = {
    where: { status: 'active' },
    search: {
      term: searchTerm,
      fields: ['name', 'email'] // Search in these fields
    },
    relations: ['profile'],
    limit: 50
  };

  const users = await userRepo.find(criteria);
  return users;
}
```

### 7. Multiple Sort Fields

```typescript
async function getUsersSortedMultiple(userRepo: BaseTypeORMRepository<User>) {
  const criteria: ICriteria<User> = {
    where: { status: 'active' },
    sort: {
      verified: 'DESC',  // Verified users first
      createdAt: 'DESC', // Then by newest
      name: 'ASC'        // Then by name alphabetically
    },
    relations: ['profile'],
    limit: 100
  };

  const users = await userRepo.find(criteria);
  return users;
}
```

### 8. Single Entity Lookup

```typescript
async function getUserById(userRepo: BaseTypeORMRepository<User>, userId: string) {
  const criteria: ICriteria<User> = {
    where: { id: userId },
    relations: ['profile', 'business'] // Load all relations
  };

  const user = await userRepo.findOne(criteria);
  return user;
}
```

### 9. Count Only (No Data)

```typescript
async function countActiveUsers(userRepo: BaseTypeORMRepository<User>) {
  const criteria: ICriteria<User> = {
    where: { status: 'active' }
  };

  const count = await userRepo.count(criteria);
  return count;
}
```

### 10. Empty Criteria (Get All)

```typescript
async function getAllUsers(userRepo: BaseTypeORMRepository<User>) {
  const criteria: ICriteria<User> = {}; // Empty = no filters

  const users = await userRepo.find(criteria);
  return users;
}
```

## Universal Pattern - Same Interface for Any Entity

### File Entity Example

```typescript
async function findUserFiles(fileRepo: BaseTypeORMRepository<File>, userId: string) {
  // EXACT SAME INTERFACE - just different entity
  const criteria: ICriteria<File> = {
    where: {
      userId: userId,
      status: 'active'
    },
    sort: { createdAt: 'DESC' },
    limit: 50
  };

  const files = await fileRepo.find(criteria);
  return files;
}
```

### Business Entity Example

```typescript
async function findBusinesses(businessRepo: BaseTypeORMRepository<Business>) {
  // SAME INTERFACE WORKS FOR ANY ENTITY
  const criteria: ICriteria<Business> = {
    where: { status: 'active' },
    sort: { name: 'ASC' },
    page: 1,
    limit: 20
  };

  const result = await businessRepo.findWithPagination(criteria);
  return result;
}
```

## Key Takeaways

### ✅ ICriteria<T> is Universal

- Works with User, File, Business, **ANY entity**
- Same interface, same methods, same patterns

### ✅ Repository Auto-Applies Everything

- Pass ICriteria object
- Repository extracts and applies all fields automatically:
  - `where` → database query conditions
  - `relations` → JOIN/populate operations
  - `sort` → ORDER BY clauses
  - `page/limit` → pagination
  - `search` → full-text search

### ✅ Type Safety

- `ICriteria<User>` knows User fields
- `ICriteria<File>` knows File fields
- Full TypeScript intellisense

### ✅ Performance Optimized

- Parameterized queries (SQL injection safe)
- Efficient JOINs for relations
- Parallel count queries for pagination
- Field selection reduces data transfer
