/**
 * Query building utilities
 */

export class QueryUtils {
  static buildSearchQuery(term: string, fields: string[]): Record<string, any> {
    return {
      $or: fields.map(field => ({
        [field]: { $regex: term, $options: 'i' }
      }))
    };
  }
}