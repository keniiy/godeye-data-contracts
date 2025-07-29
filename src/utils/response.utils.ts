/**
 * Response utilities
 */

export class ResponseUtils {
  static formatError(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}