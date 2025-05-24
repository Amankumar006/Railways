/**
 * Performance monitoring utility for tracking and optimizing app performance
 */

// Store performance metrics
const metrics: Record<string, PerformanceMetric[]> = {};

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

/**
 * Start tracking a performance metric
 * @param name Name of the operation to track
 * @param metadata Additional data to store with the metric
 * @returns A unique ID for the started metric
 */
export function startPerformanceMetric(name: string, metadata?: Record<string, any>): string {
  const id = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  if (!metrics[name]) {
    metrics[name] = [];
  }
  
  metrics[name].push({
    name,
    startTime: performance.now(),
    metadata
  });
  
  return id;
}

/**
 * End tracking a performance metric and calculate duration
 * @param name Name of the operation that was tracked
 * @returns The duration of the operation in milliseconds
 */
export function endPerformanceMetric(name: string): number | undefined {
  if (!metrics[name] || metrics[name].length === 0) {
    console.warn(`No started metric found with name: ${name}`);
    return undefined;
  }
  
  const metric = metrics[name][metrics[name].length - 1];
  metric.endTime = performance.now();
  metric.duration = metric.endTime - metric.startTime;
  
  // Log the metric for debugging
  if (__DEV__) {
    console.log(`Performance metric - ${name}: ${metric.duration.toFixed(2)}ms`, 
      metric.metadata ? `Metadata: ${JSON.stringify(metric.metadata)}` : '');
  }
  
  return metric.duration;
}

/**
 * Get average duration for a specific metric
 * @param name Name of the metric to analyze
 * @returns Average duration in milliseconds
 */
export function getAverageMetricDuration(name: string): number | undefined {
  if (!metrics[name] || metrics[name].length === 0) {
    return undefined;
  }
  
  const completedMetrics = metrics[name].filter(m => m.duration !== undefined);
  
  if (completedMetrics.length === 0) {
    return undefined;
  }
  
  const totalDuration = completedMetrics.reduce((sum, metric) => sum + (metric.duration || 0), 0);
  return totalDuration / completedMetrics.length;
}

/**
 * Clear all stored metrics or metrics for a specific operation
 * @param name Optional name of the metric to clear
 */
export function clearMetrics(name?: string): void {
  if (name) {
    delete metrics[name];
  } else {
    Object.keys(metrics).forEach(key => {
      delete metrics[key];
    });
  }
}

/**
 * Get a performance report with statistics for all tracked metrics
 * @returns Performance report object
 */
export function getPerformanceReport(): Record<string, { 
  count: number; 
  averageDuration: number; 
  minDuration: number; 
  maxDuration: number; 
}> {
  const report: Record<string, any> = {};
  
  Object.keys(metrics).forEach(name => {
    const completedMetrics = metrics[name].filter(m => m.duration !== undefined);
    
    if (completedMetrics.length === 0) {
      return;
    }
    
    const durations = completedMetrics.map(m => m.duration || 0);
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    
    report[name] = {
      count: completedMetrics.length,
      averageDuration: totalDuration / completedMetrics.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
    };
  });
  
  return report;
}

/**
 * Higher-order function to measure performance of any async function
 * @param fn Function to measure
 * @param name Name for the performance metric
 * @returns Wrapped function that measures performance
 */
export function withPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T, 
  name: string
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    startPerformanceMetric(name, { args: args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg).substring(0, 100) : arg) 
    });
    
    try {
      const result = await fn(...args);
      endPerformanceMetric(name);
      return result;
    } catch (error) {
      endPerformanceMetric(name);
      throw error;
    }
  };
}
