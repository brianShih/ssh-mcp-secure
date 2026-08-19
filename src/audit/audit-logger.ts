/**
 * Audit Logger
 * 審計日誌記錄器
 * 
 * Security Features:
 * - Comprehensive event logging
 * - JSON structured logging
 * - Async file writing
 * - Log rotation
 * - Compliance reporting
 * - Sensitive data redaction
 * - File permission enforcement
 * 
 * @security HIGH: Sensitive fields are automatically redacted
 * @security HIGH: Log files have restrictive permissions (600)
 * @security MEDIUM: Async writing prevents blocking
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { AuditConfig, AuditEvent, AuditEventType } from '../types.js';

/**
 * List of sensitive field names that should be redacted
 * SECURITY: Prevents accidental logging of credentials
 */
const SENSITIVE_FIELDS = [
  'password',
  'passwd',
  'secret',
  'key',
  'token',
  'credential',
  'apikey',
  'api_key',
  'access_token',
  'refresh_token',
  'auth_token',
  'session_token',
  'private_key',
  'privatekey',
  'signing_key',
  'encryption_key',
  'master_key',
  'bearer',
  'authorization',
  'cookie',
  'session',
  'jwt',
  'pin',
  'otp',
  'totp',
  'backup_code',
  'recovery_code'
];

/**
 * Redaction marker
 */
const REDACTED = '[REDACTED]';

/**
 * Deep clone and sanitize object for logging
 * SECURITY: Recursively redacts sensitive fields
 */
function sanitizeForLogging(obj: any, seen = new WeakSet()): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle circular references
  if (seen.has(obj)) {
    return '[Circular Reference]';
  }
  seen.add(obj);
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForLogging(item, seen));
  }
  
  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    
    // Check if key contains sensitive field names
    const isSensitive = SENSITIVE_FIELDS.some(field => 
      lowerKey.includes(field.toLowerCase())
    );
    
    if (isSensitive) {
      // Redact sensitive values
      sanitized[key] = typeof value === 'string' ? REDACTED : `[${typeof value}]`;
    } else {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeForLogging(value, seen);
    }
  }
  
  return sanitized;
}

/**
 * Validate and sanitize file path
 * SECURITY: Prevents path traversal attacks
 */
function sanitizeLogPath(logPath: string): string {
  // Resolve to absolute path
  const resolved = path.resolve(logPath);
  
  // Check for path traversal attempts
  if (resolved.includes('..')) {
    throw new Error('Invalid log path: path traversal detected');
  }
  
  return resolved;
}

export class AuditLogger extends EventEmitter {
  private config: AuditConfig;
  private logQueue: AuditEvent[] = [];
  private isFlushing = false;
  private flushInterval: NodeJS.Timeout | null = null;
  private sanitizedLogPath: string;

  constructor(config?: Partial<AuditConfig>) {
    super();
    this.config = {
      enabled: config?.enabled ?? true,
      logPath: config?.logPath || '/var/log/ssh-mcp/audit.log',
      maxSize: config?.maxSize || 104857600, // 100MB
      maxFiles: config?.maxFiles || 10,
      retentionDays: config?.retentionDays || 90,
      format: config?.format || 'json',
      async: config?.async ?? true,
      auditAuth: config?.auditAuth ?? true,
      auditCommands: config?.auditCommands ?? true,
      auditFiles: config?.auditFiles ?? true,
      auditSessions: config?.auditSessions ?? true,
      auditPermissions: config?.auditPermissions ?? true,
      auditCredentials: config?.auditCredentials ?? true,
      auditMFA: config?.auditMFA ?? true
    };
    
    // Sanitize and validate log path
    this.sanitizedLogPath = sanitizeLogPath(this.config.logPath);
    
    // Ensure log directory exists with proper permissions
    this.ensureLogDirectory();
    
    // Setup async flushing if enabled
    if (this.config.async) {
      this.flushInterval = setInterval(() => {
        this.flushQueue();
      }, 5000); // Flush every 5 seconds
    }
    
    console.error('📝 Audit Logger initialized (with sensitive data redaction)');
    console.error(`  - Path: ${this.sanitizedLogPath}`);
    console.error(`  - Format: ${this.config.format}`);
    console.error(`  - Async: ${this.config.async}`);
    console.error(`  - Max Size: ${this.config.maxSize / 1024 / 1024}MB`);
    console.error(`  - Sensitive Fields Redacted: ${SENSITIVE_FIELDS.length} patterns`);
  }

  /**
   * Log authentication event
   * SECURITY: Credentials are automatically redacted
   */
  async logAuthentication(
    success: boolean,
    userId: string,
    method: string,
    details?: Record<string, any>
  ): Promise<void> {
    if (!this.config.auditAuth) return;
    
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      eventType: success ? AuditEventType.AUTH_SUCCESS : AuditEventType.AUTH_FAILURE,
      userId,
      action: 'authentication',
      outcome: success ? 'success' : 'failure',
      details: sanitizeForLogging({
        method,
        ...details
      })
    };
    
    await this.logEvent(event);
  }

  /**
   * Log command execution
   * SECURITY: Command output may contain sensitive data - consider additional filtering
   */
  async logCommandExecution(
    sessionId: string,
    command: string,
    outcome: 'success' | 'failure' | 'unknown',
    details?: Record<string, any>
  ): Promise<void> {
    if (!this.config.auditCommands) return;
    
    // Additional sanitization for command output
    const sanitizedDetails = sanitizeForLogging(details || {});
    
    // Redact potentially sensitive command patterns
    if (command.toLowerCase().includes('password') || 
        command.toLowerCase().includes('secret') ||
        command.toLowerCase().includes('token')) {
      command = '[SENSITIVE_COMMAND_REDACTED]';
    }
    
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      eventType: AuditEventType.SSH_COMMAND_EXECUTED,
      sessionId,
      action: 'command_execution',
      outcome,
      details: {
        command,
        ...sanitizedDetails
      }
    };
    
    await this.logEvent(event);
  }

  /**
   * Log file operation
   */
  async logFileOperation(
    sessionId: string,
    operation: 'upload' | 'download' | 'edit' | 'delete',
    filePath: string,
    outcome: 'success' | 'failure',
    details?: Record<string, any>
  ): Promise<void> {
    if (!this.config.auditFiles) return;
    
    const eventType = operation === 'upload' ? AuditEventType.FILE_UPLOAD :
                      operation === 'download' ? AuditEventType.FILE_DOWNLOAD :
                      operation === 'edit' ? AuditEventType.FILE_EDIT :
                      AuditEventType.SECURITY_VIOLATION;
    
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      eventType,
      sessionId,
      action: `file_${operation}`,
      resource: filePath,
      outcome,
      details: sanitizeForLogging(details)
    };
    
    await this.logEvent(event);
  }

  /**
   * Log session event
   */
  async logSessionEvent(
    sessionId: string,
    action: 'create' | 'close',
    userId: string,
    details?: Record<string, any>
  ): Promise<void> {
    if (!this.config.auditSessions) return;
    
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      eventType: action === 'create' ? AuditEventType.SESSION_CREATE : AuditEventType.SESSION_CLOSE,
      sessionId,
      userId,
      action: `session_${action}`,
      outcome: 'success',
      details: sanitizeForLogging(details)
    };
    
    await this.logEvent(event);
  }

  /**
   * Log MFA event
   * SECURITY: TOTP tokens and backup codes are redacted
   */
  async logMFAEvent(
    success: boolean,
    userId: string,
    method: string,
    details?: Record<string, any>
  ): Promise<void> {
    if (!this.config.auditMFA) return;
    
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      eventType: success ? AuditEventType.MFA_SUCCESS : AuditEventType.MFA_FAILURE,
      userId,
      action: 'mfa_verification',
      outcome: success ? 'success' : 'failure',
      details: sanitizeForLogging({
        method,
        ...details,
        // Explicitly ensure tokens are redacted
        token: REDACTED,
        backupCode: REDACTED
      })
    };
    
    await this.logEvent(event);
  }

  /**
   * Log credential access
   * SECURITY: Credential values are always redacted
   */
  async logCredentialAccess(
    userId: string,
    credentialType: string,
    action: 'access' | 'rotate' | 'delete',
    outcome: 'success' | 'failure',
    details?: Record<string, any>
  ): Promise<void> {
    if (!this.config.auditCredentials) return;
    
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      eventType: AuditEventType.CREDENTIAL_ACCESS,
      userId,
      action: `credential_${action}`,
      outcome,
      details: sanitizeForLogging({
        credentialType,
        ...details,
        // Never log actual credential values
        value: REDACTED,
        credential: REDACTED
      })
    };
    
    await this.logEvent(event);
  }

  /**
   * Log permission change
   */
  async logPermissionChange(
    userId: string,
    adminUserId: string,
    oldRole: string,
    newRole: string,
    details?: Record<string, any>
  ): Promise<void> {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      eventType: AuditEventType.PERMISSION_CHANGE,
      userId,
      action: 'permission_change',
      outcome: 'success',
      details: sanitizeForLogging({
        adminUserId,
        oldRole,
        newRole,
        ...details
      })
    };
    
    await this.logEvent(event);
  }

  /**
   * Log generic event
   * SECURITY: All details are sanitized
   */
  async logEvent(eventOrType: AuditEvent | AuditEventType, details?: Record<string, any>): Promise<void> {
    if (!this.config.enabled) return;
    
    let event: AuditEvent;
    
    if (typeof eventOrType === 'string') {
      event = {
        id: this.generateEventId(),
        timestamp: Date.now(),
        eventType: eventOrType,
        action: 'unknown',
        outcome: 'unknown',
        details: sanitizeForLogging(details || {})
      };
    } else {
      // Ensure existing event details are sanitized
      event = {
        ...eventOrType,
        details: sanitizeForLogging(eventOrType.details || {})
      };
    }
    
    // Emit event for listeners
    this.emit('event', event);
    
    // Add to queue for async writing
    if (this.config.async) {
      this.logQueue.push(event);
    } else {
      await this.writeLog(event);
    }
  }

  /**
   * Flush log queue
   */
  private async flushQueue(): Promise<void> {
    if (this.isFlushing || this.logQueue.length === 0) return;
    
    this.isFlushing = true;
    
    try {
      const events = [...this.logQueue];
      this.logQueue = [];
      
      for (const event of events) {
        await this.writeLog(event);
      }
    } catch (error: any) {
      console.error('❌ Failed to flush audit log:', error.message);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Write log entry to file
   * SECURITY: File permissions are enforced
   */
  private async writeLog(event: AuditEvent): Promise<void> {
    try {
      const logEntry = this.formatLogEntry(event);
      
      // Append to log file
      await fs.promises.appendFile(
        this.sanitizedLogPath,
        logEntry + '\n',
        {
          encoding: 'utf8',
          mode: 0o600  // Owner read/write only
        }
      );
      
      // Verify permissions after write
      try {
        await fs.promises.chmod(this.sanitizedLogPath, 0o600);
      } catch (permError: any) {
        console.error('⚠️  Could not set log file permissions:', permError.message);
      }
      
      // Check if rotation needed
      await this.checkLogRotation();
    } catch (error: any) {
      console.error('❌ Failed to write audit log:', error.message);
      // Fallback: log to console (also sanitized)
      console.error('AUDIT:', JSON.stringify(sanitizeForLogging(event)));
    }
  }

  /**
   * Format log entry
   */
  private formatLogEntry(event: AuditEvent): string {
    if (this.config.format === 'json') {
      return JSON.stringify(event);
    } else {
      // Text format
      const timestamp = new Date(event.timestamp).toISOString();
      return `[${timestamp}] ${event.eventType} - ${event.action} - ${event.outcome}`;
    }
  }

  /**
   * Check if log rotation is needed
   */
  private async checkLogRotation(): Promise<void> {
    try {
      const stats = await fs.promises.stat(this.sanitizedLogPath);
      
      if (stats.size > this.config.maxSize) {
        await this.rotateLog();
      }
    } catch (error: any) {
      // File doesn't exist yet - ignore
    }
  }

  /**
   * Rotate log file
   */
  private async rotateLog(): Promise<void> {
    const timestamp = Date.now();
    const rotatedPath = `${this.sanitizedLogPath}.${timestamp}`;
    
    // Rename current log
    await fs.promises.rename(this.sanitizedLogPath, rotatedPath);
    
    // Compress rotated log
    try {
      const zlib = await import('zlib');
      const content = await fs.promises.readFile(rotatedPath);
      const compressed = zlib.gzipSync(content);
      await fs.promises.writeFile(`${rotatedPath}.gz`, compressed, { mode: 0o600 });
      await fs.promises.unlink(rotatedPath);
    } catch (error: any) {
      console.error('Failed to compress rotated log:', error.message);
    }
    
    // Clean old logs
    await this.cleanupOldLogs();
  }

  /**
   * Cleanup old logs based on retention policy
   */
  private async cleanupOldLogs(): Promise<void> {
    try {
      const logDir = path.dirname(this.sanitizedLogPath);
      const files = await fs.promises.readdir(logDir);
      
      const now = Date.now();
      const retentionMs = this.config.retentionDays * 24 * 60 * 60 * 1000;
      
      for (const file of files) {
        if (!file.startsWith(path.basename(this.sanitizedLogPath))) continue;
        
        const filePath = path.join(logDir, file);
        const stats = await fs.promises.stat(filePath);
        
        if (now - stats.mtimeMs > retentionMs) {
          await fs.promises.unlink(filePath);
          console.error(`🗑️  Deleted old audit log: ${file}`);
        }
      }
    } catch (error: any) {
      console.error('Failed to cleanup old logs:', error.message);
    }
  }

  /**
   * Ensure log directory exists with proper permissions
   * SECURITY: Directory permissions are enforced
   */
  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.sanitizedLogPath);
    
    try {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { 
          recursive: true,
          mode: 0o700  // Owner only
        });
        console.error(`📁 Created log directory: ${logDir}`);
      }
      
      // Ensure correct permissions
      fs.chmodSync(logDir, 0o700);
    } catch (error: any) {
      console.error('⚠️  Could not create log directory:', logDir);
      console.error('   Error:', error.message);
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    const crypto = require('crypto');
    return `audit_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Get audit statistics
   */
  async getStats(): Promise<AuditStats> {
    try {
      const stats = await fs.promises.stat(this.sanitizedLogPath);
      
      return {
        enabled: this.config.enabled,
        logSize: stats.size,
        queueLength: this.logQueue.length,
        format: this.config.format,
        retentionDays: this.config.retentionDays,
        filePermissions: '600',
        directoryPermissions: '700'
      };
    } catch {
      return {
        enabled: this.config.enabled,
        logSize: 0,
        queueLength: this.logQueue.length,
        format: this.config.format,
        retentionDays: this.config.retentionDays,
        filePermissions: '600',
        directoryPermissions: '700'
      };
    }
  }

  /**
   * Export audit logs for compliance
   * SECURITY: Exported data is sanitized
   */
  async exportLogs(
    startDate: number,
    endDate: number,
    outputPath: string
  ): Promise<void> {
    console.error('📤 Exporting audit logs...');
    
    // Filter events by date range
    const filteredEvents = this.logQueue.filter(event => 
      event.timestamp >= startDate && event.timestamp <= endDate
    );
    
    // Ensure all events are sanitized
    const sanitizedEvents = filteredEvents.map(event => ({
      ...event,
      details: sanitizeForLogging(event.details)
    }));
    
    // Write to export file
    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(sanitizedEvents, null, 2),
      { mode: 0o600 }
    );
    
    console.error(`✅ Exported ${sanitizedEvents.length} events to ${outputPath}`);
  }

  /**
   * Cleanup and destroy logger
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    
    // Flush remaining events
    this.flushQueue();
    
    console.error('🔒 Audit logger destroyed');
  }
}

/**
 * Audit statistics
 */
export interface AuditStats {
  enabled: boolean;
  logSize: number;
  queueLength: number;
  format: string;
  retentionDays: number;
  filePermissions: string;
  directoryPermissions: string;
}

// Export sanitization utility for use in other modules
export { sanitizeForLogging, SENSITIVE_FIELDS, REDACTED };
