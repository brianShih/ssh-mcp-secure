/**
 * SSH-MCP Secure - Type Definitions
 * 高安全性 SSH MCP 服務器的類型定義
 */

import { Client as SSHClient, ConnectConfig } from 'ssh2';

// ============================================================================
// SSH Session Types
// ============================================================================

export interface SSHSession {
  id: string;
  client: SSHClient;
  host: string;
  port: number;
  username: string;
  defaultDir: string;
  createdAt: number;
  lastActivity: number;
  isConnected: boolean;
  retryCount: number;
  connectionConfig: SecureConnectionConfig;
  metadata?: SessionMetadata;
}

export interface SecureConnectionConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  privateKeyPath?: string;
  passphrase?: string;
  readyTimeout?: number;
  keepaliveInterval?: number;
  algorithms?: Algorithms;
  strictHostKeyChecking?: boolean;
}

export interface Algorithms {
  kex?: string[];
  cipher?: string[];
  serverHostKey?: string[];
  hmac?: string[];
  compress?: string[];
}

export interface SessionMetadata {
  serverName?: string;
  description?: string;
  tags?: string[];
  environment?: 'production' | 'staging' | 'development';
  lastCommand?: string;
  commandCount?: number;
}

// ============================================================================
// Authentication & Security Types
// ============================================================================

export interface AuthConfig {
  allowPasswordAuth: boolean;
  requireKeyAuth: boolean;
  maxAuthRetries: number;
  lockoutDuration: number;
  keyType: 'ed25519' | 'rsa';
  minKeyBits: number;
  passphraseRequired: boolean;
}

export interface MFAConfig {
  enabled: boolean;
  requiredForProduction: boolean;
  totpIssuer: string;
  totpDigits: 6 | 8;
  totpPeriod: number;
  backupCodesCount: number;
  window: number;
}

export interface MFASecret {
  userId: string;
  secret: string;
  backupCodes: string[];
  createdAt: number;
  lastUsed?: number;
}

export interface EncryptionConfig {
  algorithm: string;
  keyLength: number;
  ivLength: number;
  tagLength: number;
  keyRotationDays: number;
}

export interface EncryptedCredential {
  id: string;
  encryptedData: string;
  iv: string;
  tag: string;
  algorithm: string;
  createdAt: number;
  expiresAt?: number;
  metadata: CredentialMetadata;
}

export interface CredentialMetadata {
  type: CredentialType;
  serverName?: string;
  username?: string;
  lastRotated?: number;
  rotationSchedule?: number;
  accessCount: number;
  lastAccessed?: number;
}

export type CredentialType = 
  | 'ssh_password'
  | 'ssh_key'
  | 'api_key'
  | 'database_password'
  | 'redis_password'
  | 'encryption_key';

// ============================================================================
// RBAC & Permission Types
// ============================================================================

export interface RBACConfig {
  enabled: boolean;
  defaultRole: Role;
  adminUsers: string[];
  denyByDefault: boolean;
  auditAll: boolean;
}

export type Role = 'admin' | 'operator' | 'developer' | 'viewer';

export interface Permission {
  resource: string;
  actions: Action[];
  conditions?: PermissionCondition[];
}

export type Action = 'create' | 'read' | 'update' | 'delete' | 'execute' | 'admin';

export interface PermissionCondition {
  attribute: string;
  operator: 'equals' | 'not_equals' | 'in' | 'not_in' | 'greater_than' | 'less_than';
  value: any;
}

export interface UserRole {
  userId: string;
  role: Role;
  permissions: Permission[];
  assignedAt: number;
  assignedBy: string;
}

// ============================================================================
// Audit & Compliance Types
// ============================================================================

export interface AuditConfig {
  enabled: boolean;
  logPath: string;
  maxSize: number;
  maxFiles: number;
  retentionDays: number;
  format: 'json' | 'text';
  async: boolean;
  auditAuth: boolean;
  auditCommands: boolean;
  auditFiles: boolean;
  auditSessions: boolean;
  auditPermissions: boolean;
  auditCredentials: boolean;
  auditMFA: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  eventType: AuditEventType;
  userId?: string;
  sessionId?: string;
  action: string;
  resource?: string;
  outcome: 'success' | 'failure' | 'unknown';
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'MFA_SUCCESS'
  | 'MFA_FAILURE'
  | 'SESSION_CREATE'
  | 'SESSION_CLOSE'
  | 'COMMAND_EXECUTE'
  | 'FILE_UPLOAD'
  | 'FILE_DOWNLOAD'
  | 'FILE_EDIT'
  | 'CREDENTIAL_ACCESS'
  | 'CREDENTIAL_ROTATE'
  | 'PERMISSION_CHANGE'
  | 'ROLE_CHANGE'
  | 'SECURITY_VIOLATION'
  | 'COMPLIANCE_CHECK';

export interface ComplianceConfig {
  frameworks: ComplianceFramework[];
  reportingEnabled: boolean;
  reportPath: string;
  autoRemediation: boolean;
}

export type ComplianceFramework = 'soc2' | 'gdpr' | 'nist' | 'hipaa' | 'pci_dss' | 'iso_27001';

export interface ComplianceReport {
  id: string;
  framework: ComplianceFramework;
  generatedAt: number;
  periodStart: number;
  periodEnd: number;
  status: 'compliant' | 'non_compliant' | 'partial';
  controls: ControlAssessment[];
  violations: ComplianceViolation[];
  recommendations: string[];
}

export interface ControlAssessment {
  controlId: string;
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'partial';
  evidence: string[];
  lastTested: number;
}

export interface ComplianceViolation {
  controlId: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  detectedAt: number;
  remediation?: string;
  remediatedAt?: number;
}

// ============================================================================
// Connection Pool Types
// ============================================================================

export interface PoolConfig {
  minPoolSize: number;
  maxPoolSize: number;
  idleTimeout: number;
  acquireTimeout: number;
  enableHealthChecks: boolean;
  enableAdaptiveScaling: boolean;
  enableConnectionReuse: boolean;
}

export interface PoolStatistics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  pendingRequests: number;
  avgWaitTime: number;
  healthCheckFailures: number;
  scalingEvents: number;
}

export interface ConnectionHealth {
  isConnected: boolean;
  latency: number;
  lastUsed: number;
  errorCount: number;
  healthScore: number;
}

// ============================================================================
// Resilience & Circuit Breaker Types
// ============================================================================

export interface CircuitBreakerConfig {
  enabled: boolean;
  threshold: number;
  timeout: number;
  resetTimeout: number;
  monitorWindow: number;
  services: string[];
}

export interface CircuitBreakerState {
  service: string;
  status: CircuitHealthStatus;
  failureCount: number;
  successCount: number;
  lastFailure?: number;
  lastSuccess?: number;
  openedAt?: number;
  halfOpenedAt?: number;
}

export type CircuitHealthStatus = 'closed' | 'open' | 'half_open';

export interface RetryConfig {
  enabled: boolean;
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier: number;
  jitterMs: number;
}

// ============================================================================
// Cache Types
// ============================================================================

export interface CacheConfig {
  enabled: boolean;
  strategy: 'lru' | 'lfu' | 'fifo';
  maxEntries: number;
  maxMemory: string;
  defaultTTL: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  memoryUsage: number;
  entryCount: number;
}

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  createdAt: number;
  expiresAt?: number;
  accessCount: number;
  lastAccessed: number;
}

// ============================================================================
// Monitoring & Alerting Types
// ============================================================================

export interface MonitoringConfig {
  prometheusPort: number;
  prometheusEnabled: boolean;
  metricsInterval: number;
  grafanaPort: number;
  grafanaEnabled: boolean;
  alertingEnabled: boolean;
  alertEmail?: string;
  alertWebhookUrl?: string;
  errorMonitoringEnabled: boolean;
  errorSampleRate: number;
  maxErrorsPerSession: number;
}

export interface PrometheusMetrics {
  ssh_connections_active: number;
  ssh_commands_total: number;
  ssh_errors_total: number;
  ssh_command_duration_seconds: number;
  ssh_session_duration_seconds: number;
  cache_hits_total: number;
  cache_misses_total: number;
  circuit_breaker_trips_total: number;
  auth_failures_total: number;
  mfa_verifications_total: number;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  source: string;
  triggeredAt: number;
  acknowledged?: boolean;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  resolved?: boolean;
  resolvedAt?: number;
}

// ============================================================================
// AI & Intelligence Types
// ============================================================================

export interface AIConfig {
  context7Enabled: boolean;
  context7ApiKey?: string;
  context7CacheDocs: boolean;
  githubIntelligenceEnabled: boolean;
  githubToken?: string;
  githubPatternMining: boolean;
  githubBestPractices: boolean;
  mlCommandPrediction: boolean;
  mlAnomalyDetection: boolean;
  mlWorkflowOptimization: boolean;
}

export interface TechnologyStack {
  primary: string;
  secondary: string[];
  confidence: number;
  detectedFiles: string[];
}

export interface CommandSuggestion {
  command: string;
  description: string;
  confidence: number;
  context: string;
  examples: string[];
  bestPractices: string[];
}

export interface DocumentationResult {
  query: string;
  results: DocumentationSnippet[];
  totalResults: number;
  cached: boolean;
}

export interface DocumentationSnippet {
  title: string;
  content: string;
  url: string;
  relevance: number;
  source: string;
}

// ============================================================================
// Backup & Recovery Types
// ============================================================================

export interface BackupConfig {
  enabled: boolean;
  path: string;
  retentionDays: number;
  compression: boolean;
  encryption: boolean;
  schedule: string;
  verifyIntegrity: boolean;
}

export interface BackupMetadata {
  id: string;
  createdAt: number;
  size: number;
  compressed: boolean;
  encrypted: boolean;
  integrityHash: string;
  verified: boolean;
  type: BackupType;
  description?: string;
}

export type BackupType = 'full' | 'incremental' | 'differential';

export interface RestoreOptions {
  backupId: string;
  targetPath?: string;
  verifyBeforeRestore: boolean;
  createPreRestoreBackup: boolean;
}

// ============================================================================
// Logging Types
// ============================================================================

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  filePath: string;
  maxSize: number;
  maxFiles: number;
  compression: boolean;
  format: 'json' | 'text';
  timestamp: boolean;
  colors: boolean;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  error?: Error;
}

// ============================================================================
// Tool & MCP Types
// ============================================================================

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  handler: (params: any) => Promise<any>;
}

export interface ToolCategory {
  name: string;
  description: string;
  tools: MCPTool[];
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    duration: number;
    sessionId?: string;
    command?: string;
  };
}

// ============================================================================
// Error Handling Types
// ============================================================================

export interface SSHError {
  code: string;
  message: string;
  host?: string;
  port?: number;
  username?: string;
  sessionId?: string;
  timestamp: number;
  stack?: string;
  cause?: Error;
}

export type SSHErrorCode =
  | 'CONNECTION_FAILED'
  | 'AUTHENTICATION_FAILED'
  | 'TIMEOUT'
  | 'HOST_KEY_VERIFICATION_FAILED'
  | 'CONNECTION_CLOSED'
  | 'COMMAND_FAILED'
  | 'FILE_TRANSFER_FAILED'
  | 'SESSION_NOT_FOUND'
  | 'POOL_EXHAUSTED'
  | 'CIRCUIT_BREAKER_OPEN'
  | 'ENCRYPTION_ERROR'
  | 'DECRYPTION_ERROR'
  | 'KEY_ROTATION_FAILED'
  | 'MFA_VERIFICATION_FAILED'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_ERROR';

// ============================================================================
// Utility Types
// ============================================================================

export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFunction<T = void> = () => Promise<T>;

export interface Result<T, E = Error> {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: number;
  checks: HealthCheckItem[];
}

export interface HealthCheckItem {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  latency?: number;
}
