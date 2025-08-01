# Aggregate Repository Tests

Comprehensive test suite for the unified aggregate repository system that works with both MongoDB (Mongoose) and SQL (TypeORM) databases.

## Test Structure

### 🧪 **Unit Tests**

#### **`mongoose-aggregate.repository.test.ts`**
Tests the MongoDB implementation:
- ✅ Pipeline building from ComplexQueryConfig
- ✅ MongoDB aggregation stages ($match, $lookup, $group, $sort)
- ✅ Pagination with $facet for parallel data+count execution
- ✅ Conditional aggregations (COUNT with conditions)
- ✅ Error handling and performance metrics
- ✅ All aggregation operations (COUNT, SUM, AVG, MIN, MAX, GROUP_CONCAT)

#### **`typeorm-aggregate.repository.test.ts`**
Tests the SQL implementation:
- ✅ Query building from ComplexQueryConfig  
- ✅ SQL JOINs (LEFT, INNER, RIGHT) with proper aliases
- ✅ WHERE conditions with parameterized queries (SQL injection protection)
- ✅ Aggregations with GROUP BY and CASE WHEN for conditional counts
- ✅ Pagination with parallel query+count execution
- ✅ Error handling and performance metrics

#### **`aggregate-integration.test.ts`**
Tests the unified system:
- ✅ Configuration validation and type safety
- ✅ Real-world scenarios (hospital agents, user reports, business dashboards)
- ✅ Response format validation (PaginatedResult structure)
- ✅ Performance expectations and improvements
- ✅ Error scenario handling

## Running Tests

```bash
# Run all tests
npm test

# Run only aggregate repository tests
npm run test:aggregate

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Test Scenarios Covered

### 🏥 **Hospital Agents Scenario**
Tests the main use case from the task requirements:
- Single query replacing 3+ separate database calls
- JOIN with business entities
- COUNT aggregations for active/pending agents
- Pagination support
- Performance monitoring

### 📊 **Business Dashboard Scenario**  
Tests complex multi-join aggregations:
- Multiple JOINs (agents, appointments, reviews)
- Multiple aggregations (COUNT, AVG, SUM)
- Conditional aggregations
- Performance optimization

### 📈 **User Activity Report Scenario**
Tests time-based reporting:
- Date range filtering
- GROUP BY operations
- Time-series aggregations
- Complex WHERE conditions

## Expected Performance Improvements

| Scenario | Old Way | New Way | Improvement |
|----------|---------|---------|-------------|
| Hospital Agents | 3 queries | 1 query | **3x faster** |
| Business Dashboard | 5+ queries | 1 query | **5x faster** |  
| User Activity | 4 queries | 1 query | **4x faster** |

## Test Coverage Goals

- **Pipeline Building**: 100% coverage of all MongoDB pipeline stages
- **Query Building**: 100% coverage of all SQL query components  
- **Error Handling**: All error scenarios and edge cases
- **Performance**: Performance metrics and optimization validation
- **Integration**: Real-world usage scenarios and data flow

## Mocking Strategy

### MongoDB Tests
- Mock Mongoose Model with aggregation pipeline
- Mock aggregation execution and results
- Test pipeline structure and stages

### SQL Tests  
- Mock TypeORM Repository and QueryBuilder
- Mock query execution and results
- Test SQL generation and parameters

### Integration Tests
- Focus on configuration validation
- Test type safety and interfaces
- Validate response structures

## Performance Benchmarks

Tests validate that the unified aggregate system meets performance expectations:

- **Simple Query**: < 50ms
- **Single JOIN**: < 100ms  
- **Multiple JOINs**: < 200ms
- **Complex Aggregation**: < 300ms
- **Paginated Query**: < 150ms

## Error Scenarios Tested

- Invalid join configurations (missing table/collection)
- Missing aggregation parameters
- Database connection errors
- Query execution failures
- Pagination errors
- Performance threshold violations

## Running Specific Test Suites

```bash
# MongoDB implementation only
jest mongoose-aggregate.repository.test.ts

# SQL implementation only  
jest typeorm-aggregate.repository.test.ts

# Integration tests only
jest aggregate-integration.test.ts

# Specific test pattern
jest --testNamePattern="Pipeline Building"
```

## Test Data Patterns

All tests use consistent mock data patterns that reflect real GOD-EYE entities:

```typescript
interface TestEntity {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  business_id: string;
  created_at: Date;
}
```

This ensures tests are realistic and catch real-world edge cases.

## Continuous Integration

Tests are designed to run in CI/CD pipelines with:
- Fast execution times (< 30 seconds total)
- No external dependencies
- Comprehensive mocking
- Clear failure messages
- Coverage reporting