/**
 * Multi-Factor Authentication Manager
 * 多因素認證管理器 - TOTP 支持
 * 
 * Security Features:
 * - TOTP (Time-based One-Time Password)
 * - Hashed backup codes (SHA-256)
 * - QR code generation
 * - Rate limiting with exponential backoff
 * - Secure secret storage
 * 
 * @security HIGH: Backup codes are hashed before storage
 * @security HIGH: Rate limiting prevents brute force
 * @security MEDIUM: TOTP secrets should be encrypted at rest
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { MFAConfig, MFASecret } from '../types.js';

/**
 * Hash backup code using SHA-256
 * SECURITY: Never store backup codes in plaintext
 */
function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Generate secure backup codes
 * SECURITY: Uses cryptographically secure random generation
 */
function generateSecureBackupCodes(count: number): { codes: string[]; hashedCodes: string[] } {
  const codes: string[] = [];
  const hashedCodes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 10-character alphanumeric code (uppercase for readability)
    const code = crypto.randomBytes(5).toString('hex').toUpperCase();
    codes.push(code);
    // Store only the hash
    hashedCodes.push(hashBackupCode(code));
  }
  
  return { codes, hashedCodes };
}

export class MFAManager extends EventEmitter {
  private config: MFAConfig;
  private secrets: Map<string, MFASecret> = new Map();
  private verificationAttempts: Map<string, VerificationAttempt[]> = new Map();
  private lockouts: Map<string, number> = new Map();

  constructor(config?: Partial<MFAConfig>) {
    super();
    this.config = {
      enabled: config?.enabled ?? true,
      requiredForProduction: config?.requiredForProduction ?? true,
      totpIssuer: config?.totpIssuer || 'SSH-MCP-Secure',
      totpDigits: config?.totpDigits || 6,
      totpPeriod: config?.totpPeriod || 30,
      backupCodesCount: config?.backupCodesCount || 10,
      window: config?.window || 1
    };
    
    console.error('🔐 MFA Manager initialized (with hashed backup codes)');
    console.error(`  - TOTP Enabled: ${this.config.enabled}`);
    console.error(`  - Required for Production: ${this.config.requiredForProduction}`);
    console.error(`  - Issuer: ${this.config.totpIssuer}`);
    console.error(`  - Digits: ${this.config.totpDigits}`);
    console.error(`  - Backup Codes: Hashed with SHA-256 ✓`);
  }

  /**
   * Setup MFA for a user
   * SECURITY: Backup codes are hashed before storage
   */
  async setupMFA(userId: string): Promise<MFASetupResult> {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `${this.config.totpIssuer}:${userId}`,
        issuer: this.config.totpIssuer,
        length: 32
      });
      
      // Generate and hash backup codes
      const { codes: plainCodes, hashedCodes } = generateSecureBackupCodes(
        this.config.backupCodesCount
      );
      
      // Store secret with hashed backup codes
      const mfaSecret: MFASecret = {
        userId,
        secret: secret.base32,
        backupCodes: hashedCodes,  // Store only hashes
        createdAt: Date.now(),
        metadata: {
          codeCount: plainCodes.length,
          setupMethod: 'initial'
        }
      };
      
      this.secrets.set(userId, mfaSecret);
      
      // Generate QR code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);
      
      return {
        success: true,
        secret: secret.base32,
        qrCodeUrl,
        backupCodes: plainCodes,  // Return plain codes ONCE for user to save
        otpAuthUrl: secret.otpauth_url,
        warning: '⚠️  Save these backup codes securely. They will not be shown again!'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verify TOTP token
   * SECURITY: Implements rate limiting with exponential backoff
   */
  verifyToken(userId: string, token: string): MFAVerificationResult {
    const mfaSecret = this.secrets.get(userId);
    
    if (!mfaSecret) {
      return {
        success: false,
        error: 'MFA not configured for user'
      };
    }
    
    // Check if account is locked out
    const lockoutExpiry = this.lockouts.get(userId);
    if (lockoutExpiry && Date.now() < lockoutExpiry) {
      const remainingMs = lockoutExpiry - Date.now();
      return {
        success: false,
        error: `Account locked due to too many failed attempts. Try again in ${Math.ceil(remainingMs / 1000)} seconds`,
        lockedOut: true,
        lockoutExpiry: lockoutExpiry
      };
    }
    
    // Check rate limiting with exponential backoff
    const rateLimitResult = this.checkRateLimit(userId);
    if (!rateLimitResult.allowed) {
      return {
        success: false,
        error: rateLimitResult.reason || 'Too many verification attempts',
        attemptsRemaining: rateLimitResult.attemptsRemaining,
        lockedOut: rateLimitResult.lockedOut,
        lockoutExpiry: rateLimitResult.lockoutExpiry
      };
    }
    
    // Check if token is a backup code (verify against hash)
    const tokenHash = hashBackupCode(token);
    const backupCodeIndex = mfaSecret.backupCodes.findIndex(
      hashedCode => hashedCode === tokenHash
    );
    
    if (backupCodeIndex !== -1) {
      // Use backup code - remove it from the list
      mfaSecret.backupCodes.splice(backupCodeIndex, 1);
      this.secrets.set(userId, mfaSecret);
      
      // Clear any lockout
      this.lockouts.delete(userId);
      this.verificationAttempts.delete(userId);
      
      this.emit('mfa_verified', {
        userId,
        method: 'backup_code',
        backupCodesRemaining: mfaSecret.backupCodes.length
      });
      
      return {
        success: true,
        method: 'backup_code',
        backupCodesRemaining: mfaSecret.backupCodes.length
      };
    }
    
    // Verify TOTP token
    const verified = speakeasy.totp.verify({
      secret: mfaSecret.secret,
      encoding: 'base32',
      token,
      window: this.config.window
    });
    
    if (verified) {
      // Update last used
      mfaSecret.lastUsed = Date.now();
      this.secrets.set(userId, mfaSecret);
      
      // Clear lockout and attempts on success
      this.lockouts.delete(userId);
      this.verificationAttempts.delete(userId);
      
      this.emit('mfa_verified', {
        userId,
        method: 'totp'
      });
      
      return {
        success: true,
        method: 'totp'
      };
    } else {
      // Record failed attempt with exponential backoff
      this.recordFailedAttempt(userId);
      
      const attempts = this.verificationAttempts.get(userId) || [];
      const failedAttempts = attempts.filter(a => !a.success).length;
      const attemptsRemaining = Math.max(0, 5 - failedAttempts);
      
      // Calculate lockout time with exponential backoff
      const lockoutSeconds = Math.pow(2, failedAttempts);
      const lockoutExpiry = Date.now() + (lockoutSeconds * 1000);
      
      if (failedAttempts >= 5) {
        this.lockouts.set(userId, lockoutExpiry);
      }
      
      return {
        success: false,
        error: 'Invalid TOTP token',
        attemptsRemaining,
        lockedOut: failedAttempts >= 5,
        lockoutExpiry: failedAttempts >= 5 ? lockoutExpiry : undefined,
        nextAttemptIn: lockoutSeconds
      };
    }
  }

  /**
   * Generate MFA challenge
   */
  async generateChallenge(userId: string): Promise<MFAChallenge> {
    const mfaSecret = this.secrets.get(userId);
    
    if (!mfaSecret) {
      // Setup MFA if not configured
      const setupResult = await this.setupMFA(userId);
      if (!setupResult.success) {
        throw new Error('Failed to setup MFA');
      }
      
      return {
        challengeId: this.generateChallengeId(),
        methods: ['totp'],
        requiresSetup: true,
        setupSecret: setupResult.secret,
        setupQrCode: setupResult.qrCodeUrl,
        backupCodes: setupResult.backupCodes,
        warning: setupResult.warning
      };
    }
    
    return {
      challengeId: this.generateChallengeId(),
      methods: ['totp', 'backup_code'],
      requiresSetup: false
    };
  }

  /**
   * Verify MFA challenge response
   */
  async verifyChallenge(
    userId: string,
    response: string
  ): Promise<MFAVerificationResult> {
    return this.verifyToken(userId, response);
  }

  /**
   * Get MFA configuration
   */
  getConfig(): MFAConfig {
    return this.config;
  }

  /**
   * Check if user has MFA configured
   */
  hasMFAConfigured(userId: string): boolean {
    return this.secrets.has(userId);
  }

  /**
   * Disable MFA for a user
   */
  disableMFA(userId: string): boolean {
    return this.secrets.delete(userId);
  }

  /**
   * Get backup codes count (not the codes themselves for security)
   */
  getBackupCodesCount(userId: string): number | undefined {
    const mfaSecret = this.secrets.get(userId);
    return mfaSecret?.backupCodes.length;
  }

  /**
   * Regenerate backup codes
   * SECURITY: Old codes are invalidated, new codes are hashed
   */
  regenerateBackupCodes(userId: string): string[] | undefined {
    const mfaSecret = this.secrets.get(userId);
    
    if (!mfaSecret) {
      return undefined;
    }
    
    // Generate and hash new backup codes
    const { codes: plainCodes, hashedCodes } = generateSecureBackupCodes(
      this.config.backupCodesCount
    );
    
    // Replace old hashed codes with new ones
    mfaSecret.backupCodes = hashedCodes;
    mfaSecret.metadata = {
      ...mfaSecret.metadata,
      codeCount: plainCodes.length,
      lastRegenerated: Date.now()
    };
    this.secrets.set(userId, mfaSecret);
    
    // Return plain codes ONCE
    return plainCodes;
  }

  /**
   * Get MFA status for a user
   */
  getMFAStatus(userId: string): MFAStatus | undefined {
    const mfaSecret = this.secrets.get(userId);
    
    if (!mfaSecret) {
      return undefined;
    }
    
    const attempts = this.verificationAttempts.get(userId) || [];
    const failedAttempts = attempts.filter(a => !a.success).length;
    const lockoutExpiry = this.lockouts.get(userId);
    
    return {
      configured: true,
      backupCodesRemaining: mfaSecret.backupCodes.length,
      failedAttempts,
      lockedOut: lockoutExpiry !== undefined && Date.now() < lockoutExpiry,
      lockoutExpiry,
      lastUsed: mfaSecret.lastUsed
    };
  }

  // Private helper methods

  /**
   * Check rate limit with exponential backoff
   */
  private checkRateLimit(userId: string): RateLimitResult {
    const now = Date.now();
    
    if (!this.verificationAttempts.has(userId)) {
      this.verificationAttempts.set(userId, []);
    }
    
    const attempts = this.verificationAttempts.get(userId)!;
    
    // Keep only attempts from last 30 minutes
    const cutoff = now - (30 * 60 * 1000);
    const recentAttempts = attempts.filter(a => a.timestamp > cutoff);
    this.verificationAttempts.set(userId, recentAttempts);
    
    const failedAttempts = recentAttempts.filter(a => !a.success).length;
    
    // Rate limit tiers with exponential backoff
    if (failedAttempts >= 10) {
      return {
        allowed: false,
        reason: 'Maximum attempts exceeded. Account locked.',
        attemptsRemaining: 0,
        lockedOut: true,
        lockoutExpiry: now + (15 * 60 * 1000) // 15 minute lockout
      };
    }
    
    if (failedAttempts >= 5) {
      const delayMs = Math.pow(2, failedAttempts - 5) * 60 * 1000; // 1, 2, 4 minutes...
      return {
        allowed: false,
        reason: `Too many failed attempts. Locked out for ${delayMs / 1000} seconds.`,
        attemptsRemaining: Math.max(0, 10 - failedAttempts),
        lockedOut: true,
        lockoutExpiry: now + delayMs
      };
    }
    
    // Check attempts in last minute
    const oneMinuteAgo = now - (60 * 1000);
    const recentOneMinute = recentAttempts.filter(a => a.timestamp > oneMinuteAgo).length;
    
    if (recentOneMinute >= 5) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded. Please wait before trying again.',
        attemptsRemaining: Math.max(0, 5 - recentOneMinute),
        lockedOut: false
      };
    }
    
    return {
      allowed: true,
      attemptsRemaining: Math.max(0, 5 - recentOneMinute),
      lockedOut: false
    };
  }

  /**
   * Record failed verification attempt
   */
  private recordFailedAttempt(userId: string): void {
    const now = Date.now();
    
    if (!this.verificationAttempts.has(userId)) {
      this.verificationAttempts.set(userId, []);
    }
    
    const attempts = this.verificationAttempts.get(userId)!;
    attempts.push({
      timestamp: now,
      success: false
    });
    
    // Keep only last 20 attempts
    if (attempts.length > 20) {
      attempts.shift();
    }
  }

  /**
   * Generate challenge ID
   */
  private generateChallengeId(): string {
    return `mfa_${crypto.randomBytes(16).toString('hex')}`;
  }
}

/**
 * MFA setup result
 */
export interface MFASetupResult {
  success: boolean;
  error?: string;
  secret?: string;
  qrCodeUrl?: string;
  backupCodes?: string[];
  otpAuthUrl?: string;
  warning?: string;
}

/**
 * MFA challenge
 */
export interface MFAChallenge {
  challengeId: string;
  methods: string[];
  requiresSetup: boolean;
  setupSecret?: string;
  setupQrCode?: string;
  backupCodes?: string[];
  warning?: string;
}

/**
 * MFA verification result
 */
export interface MFAVerificationResult {
  success: boolean;
  error?: string;
  method?: string;
  backupCodesRemaining?: number;
  attemptsRemaining?: number;
  lockedOut?: boolean;
  lockoutExpiry?: number;
  nextAttemptIn?: number;
}

/**
 * MFA status
 */
export interface MFAStatus {
  configured: boolean;
  backupCodesRemaining: number;
  failedAttempts: number;
  lockedOut: boolean;
  lockoutExpiry?: number;
  lastUsed?: number;
}

/**
 * Verification attempt
 */
interface VerificationAttempt {
  timestamp: number;
  success: boolean;
}

/**
 * Rate limit result
 */
interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  attemptsRemaining: number;
  lockedOut: boolean;
  lockoutExpiry?: number;
}
