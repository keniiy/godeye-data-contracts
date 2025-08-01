/**
 * Shared Response Building Utility (DRY)
 * Eliminates duplication in ResponseFactory time/timestamp/trace generation
 */

/**
 * BLAZING FAST: Generate unique trace ID with optimized algorithm
 * Uses high-performance random generation for maximum speed
 * @returns Unique trace identifier
 */
export function generateTraceId(): string {
  const timestamp = Date.now();
  // OPTIMIZATION: Use crypto.getRandomValues for better performance if available
  let random: string;
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // Fast crypto-based random (Node.js/Browser)
    const array = new Uint32Array(2);
    crypto.getRandomValues(array);
    random = array[0].toString(36) + array[1].toString(36);
  } else {
    // Fallback: Optimized Math.random with better entropy
    random = (Math.random() * 0x1000000000000).toString(36) + (Math.random() * 0x1000000000000).toString(36);
  }
  
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