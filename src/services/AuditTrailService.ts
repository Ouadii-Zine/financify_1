// AuditTrailService.ts - Audit trail and tracking service
// Based on the AuditTrail VBA script described in the PDF

interface AuditEvent {
  id: string;
  timestamp: string;
  eventType: string;
  description: string;
  userId: string;
  details: any;
  success: boolean;
  duration?: number;
  affectedEntities?: string[];
}

interface AuditFilter {
  eventType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  success?: boolean;
  entityId?: string;
}

export class AuditTrailService {
  private static instance: AuditTrailService;
  private events: AuditEvent[] = [];
  private maxEvents: number = 10000;
  private retentionDays: number = 2555; // 7 years for regulatory compliance
  private currentUserId: string = 'system';

  private constructor() {
    this.loadFromStorage();
    this.startCleanupTimer();
  }

  static getInstance(): AuditTrailService {
    if (!AuditTrailService.instance) {
      AuditTrailService.instance = new AuditTrailService();
    }
    return AuditTrailService.instance;
  }

  // Log an audit event
  logEvent(eventType: string, description: string, details: any = {}, success: boolean = true, duration?: number): void {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      eventType,
      description,
      userId: this.currentUserId,
      details,
      success,
      duration,
      affectedEntities: this.extractAffectedEntities(details)
    };

    this.events.push(event);
    
    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    this.saveToStorage();
    console.log(`📋 Audit: ${eventType} - ${description} (${success ? 'SUCCESS' : 'FAILED'})`);
  }

  // Set current user ID
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
    this.logEvent('USER_SESSION', `User session started: ${userId}`, { userId });
  }

  // Get events with optional filtering
  getEvents(filter?: AuditFilter, limit?: number): AuditEvent[] {
    let filteredEvents = [...this.events];

    if (filter) {
      if (filter.eventType) {
        filteredEvents = filteredEvents.filter(e => e.eventType === filter.eventType);
      }
      if (filter.userId) {
        filteredEvents = filteredEvents.filter(e => e.userId === filter.userId);
      }
      if (filter.dateFrom) {
        filteredEvents = filteredEvents.filter(e => e.timestamp >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        filteredEvents = filteredEvents.filter(e => e.timestamp <= filter.dateTo!);
      }
      if (filter.success !== undefined) {
        filteredEvents = filteredEvents.filter(e => e.success === filter.success);
      }
      if (filter.entityId) {
        filteredEvents = filteredEvents.filter(e => 
          e.affectedEntities?.includes(filter.entityId!)
        );
      }
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit if specified
    if (limit && limit > 0) {
      filteredEvents = filteredEvents.slice(0, limit);
    }

    return filteredEvents;
  }

  // Get event by ID
  getEvent(id: string): AuditEvent | null {
    return this.events.find(e => e.id === id) || null;
  }

  // Get events by type
  getEventsByType(eventType: string): AuditEvent[] {
    return this.events.filter(e => e.eventType === eventType);
  }

  // Get recent events (last N events)
  getRecentEvents(count: number = 50): AuditEvent[] {
    return this.events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, count);
  }

  // Get failed events
  getFailedEvents(limit?: number): AuditEvent[] {
    return this.getEvents({ success: false }, limit);
  }

  // Get events for a specific entity
  getEventsForEntity(entityId: string): AuditEvent[] {
    return this.events.filter(e => e.affectedEntities?.includes(entityId));
  }

  // Generate audit report
  generateAuditReport(filter?: AuditFilter): string {
    const events = this.getEvents(filter);
    const totalEvents = events.length;
    const successfulEvents = events.filter(e => e.success).length;
    const failedEvents = events.filter(e => !e.success).length;
    
    const eventTypes = [...new Set(events.map(e => e.eventType))];
    const users = [...new Set(events.map(e => e.userId))];
    
    const report = `
Audit Trail Report
==================
Period: ${filter?.dateFrom || 'All time'} to ${filter?.dateTo || 'Present'}
Total Events: ${totalEvents}
Successful Events: ${successfulEvents} (${((successfulEvents / totalEvents) * 100).toFixed(2)}%)
Failed Events: ${failedEvents} (${((failedEvents / totalEvents) * 100).toFixed(2)}%)

Event Types:
${eventTypes.map(type => `  ${type}: ${events.filter(e => e.eventType === type).length} events`).join('\n')}

Active Users:
${users.map(user => `  ${user}: ${events.filter(e => e.userId === user).length} events`).join('\n')}

Recent Events:
${events.slice(0, 10).map(e => `  ${e.timestamp} - ${e.eventType}: ${e.description} (${e.success ? 'OK' : 'FAILED'})`).join('\n')}
    `;

    return report.trim();
  }

  // Export audit data
  exportAuditData(filter?: AuditFilter): string {
    const events = this.getEvents(filter);
    return JSON.stringify(events, null, 2);
  }

  // Clear old events (retention policy)
  private cleanupOldEvents(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
    
    const initialCount = this.events.length;
    this.events = this.events.filter(e => new Date(e.timestamp) > cutoffDate);
    
    const removedCount = initialCount - this.events.length;
    if (removedCount > 0) {
      console.log(`🧹 Audit cleanup: ${removedCount} old events removed`);
      this.saveToStorage();
    }
  }

  // Generate unique event ID
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Extract affected entities from event details
  private extractAffectedEntities(details: any): string[] {
    const entities: string[] = [];
    
    if (details.loanId) entities.push(details.loanId);
    if (details.portfolioId) entities.push(details.portfolioId);
    if (details.userId) entities.push(details.userId);
    if (details.facilityId) entities.push(details.facilityId);
    
    // Look for ID patterns in details
    const detailsStr = JSON.stringify(details);
    const idMatches = detailsStr.match(/[a-z]+Id["']?\s*:\s*["']?([^"',}\s]+)/gi);
    if (idMatches) {
      idMatches.forEach(match => {
        const id = match.split(':')[1].replace(/["',\s]/g, '');
        if (id && !entities.includes(id)) {
          entities.push(id);
        }
      });
    }
    
    return entities;
  }

  // Save to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem('audit_trail', JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save audit trail to storage:', error);
    }
  }

  // Load from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('audit_trail');
      if (stored) {
        this.events = JSON.parse(stored);
        console.log(`📋 Loaded ${this.events.length} audit events from storage`);
      }
    } catch (error) {
      console.error('Failed to load audit trail from storage:', error);
      this.events = [];
    }
  }

  // Start cleanup timer
  private startCleanupTimer(): void {
    // Run cleanup daily
    setInterval(() => {
      this.cleanupOldEvents();
    }, 24 * 60 * 60 * 1000);
  }

  // Get audit statistics
  getStatistics(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByUser: Record<string, number>;
    successRate: number;
    averageEventsPerDay: number;
    oldestEvent: string;
    newestEvent: string;
  } {
    const eventsByType: Record<string, number> = {};
    const eventsByUser: Record<string, number> = {};
    
    this.events.forEach(event => {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      eventsByUser[event.userId] = (eventsByUser[event.userId] || 0) + 1;
    });
    
    const successfulEvents = this.events.filter(e => e.success).length;
    const successRate = this.events.length > 0 ? (successfulEvents / this.events.length) * 100 : 0;
    
    // Calculate average events per day
    const sortedEvents = [...this.events].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    let averageEventsPerDay = 0;
    if (sortedEvents.length > 1) {
      const firstEvent = new Date(sortedEvents[0].timestamp);
      const lastEvent = new Date(sortedEvents[sortedEvents.length - 1].timestamp);
      const daysDiff = (lastEvent.getTime() - firstEvent.getTime()) / (1000 * 60 * 60 * 24);
      averageEventsPerDay = daysDiff > 0 ? this.events.length / daysDiff : 0;
    }
    
    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsByUser,
      successRate,
      averageEventsPerDay,
      oldestEvent: sortedEvents[0]?.timestamp || 'None',
      newestEvent: sortedEvents[sortedEvents.length - 1]?.timestamp || 'None'
    };
  }

  // Set retention policy
  setRetentionPolicy(days: number): void {
    this.retentionDays = days;
    console.log(`🔧 Audit retention policy set to ${days} days`);
    this.cleanupOldEvents();
  }

  // Clear all audit events (use with caution)
  clearAllEvents(): void {
    const eventCount = this.events.length;
    this.events = [];
    this.saveToStorage();
    console.log(`🗑️ All ${eventCount} audit events cleared`);
  }
}

export default AuditTrailService; 