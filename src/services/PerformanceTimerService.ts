// PerformanceTimerService.ts - Performance monitoring service
// Based on the PerformanceTimer VBA script described in the PDF

interface TimerMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: number;
  iterations?: number;
}

interface PerformanceReport {
  totalDuration: number;
  functionsExecuted: number;
  bottlenecks: string[];
  memoryPeak: number;
  averageIterationTime: number;
  performanceScore: number;
}

export class PerformanceTimerService {
  private static instance: PerformanceTimerService;
  private timers: Map<string, TimerMetric> = new Map();
  private completedTimers: TimerMetric[] = [];
  private memoryBaseline: number = 0;
  private optimizationEnabled: boolean = true;

  private constructor() {
    this.memoryBaseline = this.getMemoryUsage();
  }

  static getInstance(): PerformanceTimerService {
    if (!PerformanceTimerService.instance) {
      PerformanceTimerService.instance = new PerformanceTimerService();
    }
    return PerformanceTimerService.instance;
  }

  // Start timing a function
  startTimer(functionName: string): void {
    const timer: TimerMetric = {
      name: functionName,
      startTime: performance.now(),
      memoryUsage: this.getMemoryUsage(),
      iterations: 0
    };
    
    this.timers.set(functionName, timer);
    console.log(`⏱️ Starting timer: ${functionName}`);
  }

  // End timing and record results
  endTimer(functionName: string): number {
    const timer = this.timers.get(functionName);
    if (!timer) {
      console.warn(`⚠️ Timer not found: ${functionName}`);
      return 0;
    }

    const endTime = performance.now();
    const duration = endTime - timer.startTime;
    
    timer.endTime = endTime;
    timer.duration = duration;
    
    // Record completed timer
    this.completedTimers.push({ ...timer });
    
    // Remove from active timers
    this.timers.delete(functionName);
    
    console.log(`✅ Timer completed: ${functionName} - ${duration.toFixed(2)}ms`);
    
    // Auto-optimize if enabled and duration is high
    if (this.optimizationEnabled && duration > 5000) {
      this.logBottleneck(functionName, duration);
    }
    
    return duration;
  }

  // Increment iteration count for a timer
  incrementIterations(functionName: string): void {
    const timer = this.timers.get(functionName);
    if (timer) {
      timer.iterations = (timer.iterations || 0) + 1;
    }
  }

  // Get memory usage (simplified)
  private getMemoryUsage(): number {
    if ((performance as any).memory) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  // Log performance bottleneck
  private logBottleneck(functionName: string, duration: number): void {
    console.warn(`🐌 Performance bottleneck detected: ${functionName} took ${duration.toFixed(2)}ms`);
    
    // Store bottleneck for reporting
    const bottleneck = {
      function: functionName,
      duration: duration,
      timestamp: new Date().toISOString()
    };
    
    const bottlenecks = this.getBottlenecks();
    bottlenecks.push(bottleneck);
    localStorage.setItem('performance_bottlenecks', JSON.stringify(bottlenecks));
  }

  // Get current bottlenecks
  private getBottlenecks(): any[] {
    const stored = localStorage.getItem('performance_bottlenecks');
    return stored ? JSON.parse(stored) : [];
  }

  // Generate performance report
  generateReport(): PerformanceReport {
    const totalDuration = this.completedTimers.reduce((sum, timer) => sum + (timer.duration || 0), 0);
    const functionsExecuted = this.completedTimers.length;
    const bottlenecks = this.getBottlenecks().map(b => `${b.function}: ${b.duration.toFixed(2)}ms`);
    
    // Calculate memory peak
    const memoryPeak = Math.max(...this.completedTimers.map(t => t.memoryUsage || 0));
    
    // Calculate average iteration time
    const totalIterations = this.completedTimers.reduce((sum, timer) => sum + (timer.iterations || 0), 0);
    const averageIterationTime = totalIterations > 0 ? totalDuration / totalIterations : 0;
    
    // Calculate performance score (lower is better)
    const performanceScore = this.calculatePerformanceScore(totalDuration, bottlenecks.length);
    
    return {
      totalDuration,
      functionsExecuted,
      bottlenecks,
      memoryPeak,
      averageIterationTime,
      performanceScore
    };
  }

  // Calculate performance score
  private calculatePerformanceScore(totalDuration: number, bottleneckCount: number): number {
    // Simple scoring algorithm: base score + duration penalty + bottleneck penalty
    const baseScore = 100;
    const durationPenalty = Math.min(totalDuration / 1000, 50); // Max 50 points for duration
    const bottleneckPenalty = bottleneckCount * 10; // 10 points per bottleneck
    
    return Math.max(0, baseScore - durationPenalty - bottleneckPenalty);
  }

  // Get detailed metrics
  getMetrics(): {
    activeTimers: string[];
    completedTimers: TimerMetric[];
    totalExecutionTime: number;
    averageExecutionTime: number;
    slowestFunction: string;
    fastestFunction: string;
  } {
    const activeTimers = Array.from(this.timers.keys());
    const completedTimers = [...this.completedTimers];
    const totalExecutionTime = completedTimers.reduce((sum, timer) => sum + (timer.duration || 0), 0);
    const averageExecutionTime = completedTimers.length > 0 ? totalExecutionTime / completedTimers.length : 0;
    
    // Find slowest and fastest functions
    const durations = completedTimers.map(t => ({ name: t.name, duration: t.duration || 0 }));
    durations.sort((a, b) => b.duration - a.duration);
    
    const slowestFunction = durations[0]?.name || 'N/A';
    const fastestFunction = durations[durations.length - 1]?.name || 'N/A';
    
    return {
      activeTimers,
      completedTimers,
      totalExecutionTime,
      averageExecutionTime,
      slowestFunction,
      fastestFunction
    };
  }

  // Reset all timers
  reset(): void {
    this.timers.clear();
    this.completedTimers = [];
    this.memoryBaseline = this.getMemoryUsage();
    console.log('🔄 Performance timers reset');
  }

  // Enable/disable auto-optimization
  setOptimizationEnabled(enabled: boolean): void {
    this.optimizationEnabled = enabled;
    console.log(`🔧 Performance optimization ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Get optimization suggestions
  getOptimizationSuggestions(): string[] {
    const suggestions: string[] = [];
    const bottlenecks = this.getBottlenecks();
    
    if (bottlenecks.length > 0) {
      suggestions.push(`Found ${bottlenecks.length} performance bottlenecks that need attention`);
    }
    
    const report = this.generateReport();
    if (report.performanceScore < 70) {
      suggestions.push('Overall performance score is below 70 - consider optimization');
    }
    
    if (report.memoryPeak > this.memoryBaseline * 2) {
      suggestions.push('Memory usage is significantly higher than baseline');
    }
    
    // Find functions that take > 1 second
    const slowFunctions = this.completedTimers.filter(t => (t.duration || 0) > 1000);
    if (slowFunctions.length > 0) {
      suggestions.push(`${slowFunctions.length} functions took longer than 1 second`);
    }
    
    return suggestions;
  }

  // Export performance data
  exportPerformanceData(): string {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      report: this.generateReport(),
      suggestions: this.getOptimizationSuggestions()
    };
    
    return JSON.stringify(data, null, 2);
  }
}

export default PerformanceTimerService; 