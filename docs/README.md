# Documentation - @kenniy/godeye-data-contracts v1.2.5

Complete documentation for the GOD-EYE Data Contracts package.

## Quick Links

- [API Reference](./API-REFERENCE.md) - Complete API documentation
- [Migration Guide](./MIGRATION-GUIDE.md) - Upgrade and migration instructions  
- [Best Practices](./BEST-PRACTICES.md) - Implementation best practices
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and solutions

## What's New in v1.2.5

### Swagger UI Enhancements
- Enhanced Swagger UI with better UX and performance
- Smart description truncation with external doc linking
- Custom CSS and responsive design improvements
- Dynamic service titles and enhanced navigation

### Description Optimization System
- Intelligent truncation respects sentence boundaries
- Configurable limits with `DescriptionConfig`
- External documentation integration
- Cleaner API documentation

### Deep Population Support
- Enhanced schemas for deeply nested objects
- Flexible data types with `oneOf` schemas
- Rich metadata tracking for performance analysis
- Support for complex populated responses

## Documentation Structure

### Core Documentation
- **[API Reference](./API-REFERENCE.md)** - Complete class and method documentation
- **[Migration Guide](./MIGRATION-GUIDE.md)** - Version upgrades and pattern migrations
- **[Best Practices](./BEST-PRACTICES.md)** - Enterprise implementation patterns
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Solutions for common issues

### Examples Directory
- **[Complete Max Usage](../examples/complete-max-usage.md)** - Full flow demonstration
- **[Aggregate Usage](../examples/aggregate-usage.md)** - Single query patterns
- **[Bootstrap Usage](../examples/bootstrap-usage.md)** - Service setup guide
- **[Kong Usage](../examples/kong-usage.md)** - Gateway integration
- **[Smart API Usage](../examples/smart-api-usage.md)** - Swagger automation
- **[DTO Usage](../examples/dto-usage.md)** - Frontend integration
- **[Validation Pipeline Usage](../examples/validation-pipeline-usage.md)** - Input validation

### Performance Documentation
- **[Benchmark Results](../performance/benchmark-results.md)** - Performance analysis and metrics
- **[Test Documentation](../src/tests/README.md)** - Comprehensive test coverage information

## Getting Started

### Installation
```bash
npm install @kenniy/godeye-data-contracts@1.2.5
```

### Basic Setup
```typescript
import {
  BaseTypeORMRepository,
  FindManyDto,
  IWhereConfig,
  SearchStrategy,
  ResponseFactory,
  bootstrap
} from '@kenniy/godeye-data-contracts';

// Bootstrap your service
const app = await bootstrap(AppModule, {
  serviceName: 'my-service',
  port: 3003,
  enableSwagger: true
});
```

### Quick Example
```typescript
@Controller('users')
export class UsersController {
  @Get()
  async getUsers(@Query() queryDto: FindManyDto) {
    const whereConfig: IWhereConfig = {
      conditions: { status: 'active', isDeleted: false },
      searchConfig: [{
        fields: ["firstName", "lastName"],
        defaultStrategy: SearchStrategy.FUZZY,
        priority: 10,
        weight: 1.0
      }]
    };

    const result = await this.userRepository.findWithPagination(whereConfig, queryDto);
    return ResponseFactory.success(result);
  }
}
```

## Architecture Overview

### Core Components

#### Repository System
- **BaseTypeORMRepository** - PostgreSQL/MySQL repository
- **BaseMongooseRepository** - MongoDB repository  
- **Aggregate Repositories** - Advanced query optimization
- **Enhanced Repositories** - Next-generation algorithms

#### Response System
- **ResponseFactory** - Auto-detecting response formatter
- **Smart API Documentation** - Automated Swagger generation
- **Validation Pipeline** - Enterprise input validation

#### Authentication
- **Kong Integration** - Gateway user context extraction
- **Role-Based Access** - Declarative permission control
- **Security Patterns** - Input sanitization and validation

### Key Features

#### Intelligent Search
- Multiple search strategies (EXACT, FUZZY, CONTAINS, etc.)
- Field priority weighting and relevance scoring
- Context-aware dynamic conditions
- Performance monitoring and optimization

#### Performance Optimization
- Zero runtime overhead with compile-time optimization
- Parallel query execution for count and data
- Advanced caching with LRU validation
- Memory-efficient streaming for large datasets

#### Enterprise Features
- Comprehensive error classification and handling
- Performance monitoring with configurable thresholds
- Transaction management with ACID compliance
- Production-ready configuration and deployment patterns

## Version History

### v1.2.5 (Latest)
- Swagger UI enhancements and optimization
- Description truncation with external docs
- Deep population response support
- Enhanced @Api decorator features

### v1.2.1-1.2.4
- Incremental improvements and bug fixes
- Performance optimizations
- Enhanced metadata tracking

### v1.1.0
- Deep relations support for TypeORM and Mongoose
- Enhanced performance monitoring
- Improved error handling patterns

### v1.0.0
- Initial release with complete feature set
- ORM-agnostic repository architecture
- Response factory auto-detection
- Kong authentication integration

## Support

### Resources
- **GitHub Repository** - Source code and issues
- **Performance Benchmarks** - Enterprise-grade performance analysis
- **Test Coverage** - 167 comprehensive tests
- **Examples** - Real-world implementation patterns

### Getting Help
1. Check the [Troubleshooting Guide](./TROUBLESHOOTING.md) for common issues
2. Review [Best Practices](./BEST-PRACTICES.md) for implementation guidance
3. Consult the [API Reference](./API-REFERENCE.md) for detailed documentation
4. Use the [Migration Guide](./MIGRATION-GUIDE.md) for version upgrades

### Contributing
The package is designed for production use across the GOD-EYE ecosystem. For feature requests or bug reports, follow the established enterprise development process.

## License

MIT License - See main repository for full license terms.

---

**Enterprise-Ready** | **Production-Tested** | **Zero Runtime Overhead**

This documentation covers the complete GOD-EYE Data Contracts system designed for enterprise microservices with intelligent search, unified data access, and superior performance.