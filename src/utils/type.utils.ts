/**
 * Type utilities
 */

export class TypeUtils {
  static isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
}