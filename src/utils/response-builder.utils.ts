/**
 * Shared Response Building Utility (DRY)
 * Eliminates duplication in ResponseFactory time/timestamp/trace generation
 */

/**
 * Generate unique trace ID for request tracking
 * @returns Unique trace identifier
 */
export function generateTraceId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `trace_${timestamp}_${random}`;
}

/**
 * Build base response metadata (DRY utility)
 * @param start_time - Optional start time for duration calculation
 * @returns Base response metadata object
 */
export function buildBaseResponseMetadata(start_time?: number) {
  const now = Date.now();
  return {
    time_ms: start_time ? now - start_time : 0,
    timestamp: new Date().toISOString(),
    trace_id: generateTraceId(),
  };
}