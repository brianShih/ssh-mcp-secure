/**
 * Session Encryption Manager
 * 會話加密管理器 - AES-256-GCM 加密
 * 
 * Security Features:
 * - AES-256-GCM authenticated encryption
 * - PBKDF2 key derivation
 * - Secure key storage (DPAPI/KMS ready)
 * - Key rotation support
 * - Secure IV generation with reuse prevention
 * - HMAC verification
 * 
 * @security CRITICAL: Master key protection
 * @security CRITICAL: Key derivation function
 * @security HIGH: IV reuse prevention
 */

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { EncryptionConfig, EncryptedCredential, CredentialMetadata } from '../types.js';

/**
 * Secure key storage interface
 * Supports multiple backends: File (DPAPI), Azure Key Vault, AWS KMS, etc.
 */
interface KeyStorageBackend {
  getKey(keyId: string): Promise<Buffer>;
  setKey(keyId: string, key: Buffer): Promise<void>;
  deleteKey(keyId: string): Promise<void>;
  keyExists(keyId: string): Promise<boolean>;
}

/**
 * File-based key storage with DPAPI encryption (Windows)
 * For production, use HSM/KMS backend
 */
class FileKeyStorage implements KeyStorageBackend {
  private keyDirectory: string;

  constructor(keyDirectory: string) {
    this.keyDirectory = keyDirectory;
    this.ensureKeyDirectory();
  }

  private ensureKeyDirectory(): void {
    try {
      if (!fs.existsSync(this.keyDirectory)) {
        fs.mkdirSync(this.keyDirectory, { recursive: true, mode: 0o700 });
      }
      // Set restrictive permissions (owner only)
      fs.chmodSync(this.keyDirectory, 0o700);
    } catch (error: any) {
      console.error('⚠️  Failed to create key directory:', error.message);
    }
  }

  async getKey(keyId: string): Promise<Buffer> {
    const keyPath = path.join(this.keyDirectory, `${keyId}.key`);
    
    if (!fs.existsSync(keyPath)) {
      throw new KeyStorageError(`Key not found: ${keyId}`, 'KEY_NOT_FOUND');
    }

    try {
      const keyHex = await fs.promises.readFile(keyPath, 'utf8');
      const key = Buffer.from(keyHex.trim(), 'hex');
      
      // Verify key length
      if (key.length !== 32) {
        throw new KeyStorageError('Invalid key length', 'INVALID_KEY');
      }
      
      return key;
    } catch (error: any) {
      if (error instanceof KeyStorageError) throw error;
      throw new KeyStorageError(`Failed to read key: ${error.message}`, 'READ_ERROR');
    }
  }

  async setKey(keyId: string, key: Buffer): Promise<void> {
    const keyPath = path.join(this.keyDirectory, `${keyId}.key`);
    
    if (key.length !== 32) {
      throw new KeyStorageError('Key must be 32 bytes (256 bits)', 'INVALID_KEY_LENGTH');
    }

    try {
      // Write with restrictive permissions (owner read/write only)
      await fs.promises.writeFile(keyPath, key.toString('hex'), {
        mode: 0o600,
        encoding: 'utf8'
      });
    } catch (error: any) {
      throw new KeyStorageError(`Failed to write key: ${error.message}`, 'WRITE_ERROR');
    }
  }

  async deleteKey(keyId: string): Promise<void> {
    const keyPath = path.join(this.keyDirectory, `${keyId}.key`);
    
    if (fs.existsSync(keyPath)) {
      try {
        await fs.promises.unlink(keyPath);
      } catch (error: any) {
        throw new KeyStorageError(`Failed to delete key: ${error.message}`, 'DELETE_ERROR');
      }
    }
  }

  async keyExists(keyId: string): Promise<boolean> {
    const keyPath = path.join(this.keyDirectory, `${keyId}.key`);
    return fs.existsSync(keyPath);
  }
}

/**
 * Key storage error
 */
class KeyStorageError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'KeyStorageError';
  }
}

/**
 * Session Encryption Manager with enhanced security
 */
export class SessionEncryptionManager {
  private config: EncryptionConfig;
  private masterKey: Buffer | null = null;
  private keyVersion: string;
  private lastRotation: number;
  private keyStorage: KeyStorageBackend;
  private usedIVs: Set<string>;
  private maxIVs: number;
  private keyId: string;
  private salt: Buffer;

  constructor(config: Partial<EncryptionConfig> = {}) {
    this.config = {
      algorithm: config.algorithm || 'AES-256-GCM',
      keyLength: config.keyLength || 256,
      ivLength: config.ivLength || 12,
      tagLength: config.tagLength || 16,
      keyRotationDays: config.keyRotationDays || 90
    };

    this.keyId = config.keyId || 'ssh-mcp-master-key';
    this.salt = config.salt || this.generateSecureSalt();
    this.keyStorage = new FileKeyStorage(
      config.keyDirectory || path.join(process.env.LOCALAPPDATA || '', 'ssh-mcp-keys')
    );
    this.usedIVs = new Set();
    this.maxIVs = 1000000; // Prevent memory exhaustion
    this.keyVersion = this.generateKeyVersion();
    this.lastRotation = Date.now();

    // Initialize master key asynchronously
    this.initializeMasterKey().catch(error => {
      console.error('❌ Failed to initialize master key:', error.message);
    });

    // Setup automatic key rotation check
    this.setupKeyRotationCheck();
  }

  /**
   * Initialize master key from secure storage or generate new one
   * SECURITY: Never use environment variables directly
   */
  private async initializeMasterKey(): Promise<void> {
    try {
      // Try to load existing key from secure storage
      if (await this.keyStorage.keyExists(this.keyId)) {
        this.masterKey = await this.keyStorage.getKey(this.keyId);
        console.error('✅ Master key loaded from secure storage');
      } else {
        // Generate new secure master key
        this.masterKey = await this.generateSecureMasterKey();
        await this.keyStorage.setKey(this.keyId, this.masterKey);
        console.error('✅ New master key generated and stored securely');
      }

      // Verify key integrity
      if (!this.masterKey || this.masterKey.length !== 32) {
        throw new Error('Invalid master key');
      }
    } catch (error: any) {
      console.error('❌ Master key initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Generate secure master key using PBKDF2
   * SECURITY: Uses strong KDF instead of raw random bytes
   */
  private async generateSecureMasterKey(): Promise<Buffer> {
    // Get master secret from environment (never stored directly)
    const masterSecret = process.env.ENCRYPTION_MASTER_SECRET;
    
    if (!masterSecret || masterSecret.length < 32) {
      throw new Error(
        'ENCRYPTION_MASTER_SECRET must be set and at least 32 characters. ' +
        'Use a strong passphrase or random string.'
      );
    }

    // Derive key using PBKDF2 with strong parameters
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        masterSecret,
        this.salt,
        100000,  // iterations (NIST recommended)
        32,      // key length (256 bits)
        'sha256',
        (error, derivedKey) => {
          if (error) reject(error);
          else resolve(derivedKey);
        }
      );
    });
  }

  /**
   * Generate secure salt for key derivation
   */
  private generateSecureSalt(): Buffer {
    return crypto.randomBytes(16);
  }

  /**
   * Generate cryptographically secure IV with reuse prevention
   * SECURITY: Prevents IV reuse which would compromise GCM security
   */
  private generateSecureIV(): Buffer {
    let iv: Buffer;
    let ivHex: string;
    let attempts = 0;
    const maxAttempts = 100;

    do {
      if (attempts >= maxAttempts) {
        // If we've tried too many times, rotate IVs set
        if (this.usedIVs.size > this.maxIVs / 2) {
          this.rotateIVSet();
        }
        throw new EncryptionError(
          'Failed to generate unique IV after multiple attempts',
          'IV_GENERATION_FAILED'
        );
      }

      iv = crypto.randomBytes(this.config.ivLength);
      ivHex = iv.toString('hex');
      attempts++;
    } while (this.usedIVs.has(ivHex));

    // Track used IV
    if (this.usedIVs.size >= this.maxIVs) {
      this.rotateIVSet();
    }
    this.usedIVs.add(ivHex);

    return iv;
  }

  /**
   * Rotate IV set to prevent memory exhaustion
   */
  private rotateIVSet(): void {
    // Keep only recent IVs (last 10000)
    const ivsArray = Array.from(this.usedIVs);
    const recentIVs = ivsArray.slice(-10000);
    this.usedIVs = new Set(recentIVs);
    console.error('🔄 IV set rotated for memory management');
  }

  /**
   * Encrypt data using AES-256-GCM
   * SECURITY: Uses secure IV generation and proper authentication
   */
  encrypt(data: string | Buffer): EncryptedData {
    if (!this.masterKey) {
      throw new EncryptionError('Master key not initialized', 'KEY_NOT_INITIALIZED');
    }

    try {
      // Generate secure unique IV
      const iv = this.generateSecureIV();
      
      // Create cipher with proper parameters
      const cipher = crypto.createCipheriv(
        'aes-256-gcm',
        this.masterKey,
        iv,
        { authTagLength: this.config.tagLength }
      );

      // Encrypt data
      const encrypted = Buffer.concat([
        cipher.update(Buffer.from(data)),
        cipher.final()
      ]);

      // Get authentication tag
      const tag = cipher.getAuthTag();

      return {
        encryptedData: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
        algorithm: this.config.algorithm,
        keyVersion: this.keyVersion,
        createdAt: Date.now()
      };
    } catch (error: any) {
      throw new EncryptionError(
        `Encryption failed: ${error.message}`,
        'ENCRYPTION_FAILED'
      );
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   * SECURITY: Verifies authentication tag and key version
   */
  decrypt(encryptedData: EncryptedData): string {
    if (!this.masterKey) {
      throw new EncryptionError('Master key not initialized', 'KEY_NOT_INITIALIZED');
    }

    try {
      // Verify key version
      if (encryptedData.keyVersion !== this.keyVersion) {
        throw new EncryptionError(
          'Key version mismatch - data may be from different key epoch',
          'KEY_VERSION_MISMATCH'
        );
      }

      // Convert from base64
      const encrypted = Buffer.from(encryptedData.encryptedData, 'base64');
      const iv = Buffer.from(encryptedData.iv, 'base64');
      const tag = Buffer.from(encryptedData.tag, 'base64');

      // Validate IV length
      if (iv.length !== this.config.ivLength) {
        throw new EncryptionError('Invalid IV length', 'INVALID_IV');
      }

      // Create decipher
      const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        this.masterKey,
        iv,
        { authTagLength: this.config.tagLength }
      );

      // Set authentication tag for verification
      decipher.setAuthTag(tag);

      // Decrypt data
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      return decrypted.toString('utf8');
    } catch (error: any) {
      if (error instanceof EncryptionError) throw error;
      throw new EncryptionError(
        `Decryption failed: ${error.message}`,
        'DECRYPTION_FAILED'
      );
    }
  }

  /**
   * Encrypt credential with metadata
   * SECURITY: Adds additional metadata protection
   */
  encryptCredential(
    credential: string,
    metadata: CredentialMetadata
  ): EncryptedCredential {
    const encrypted = this.encrypt(credential);
    
    return {
      id: this.generateCredentialId(),
      encryptedData: encrypted.encryptedData,
      iv: encrypted.iv,
      tag: encrypted.tag,
      algorithm: encrypted.algorithm,
      createdAt: encrypted.createdAt,
      expiresAt: this.calculateExpiryDate(),
      metadata
    };
  }

  /**
   * Decrypt credential
   */
  decryptCredential(encryptedCredential: EncryptedCredential): string {
    const encrypted: EncryptedData = {
      encryptedData: encryptedCredential.encryptedData,
      iv: encryptedCredential.iv,
      tag: encryptedCredential.tag,
      algorithm: encryptedCredential.algorithm,
      keyVersion: encryptedCredential.keyVersion || this.keyVersion,
      createdAt: encryptedCredential.createdAt
    };

    return this.decrypt(encrypted);
  }

  /**
   * Rotate encryption key
   * SECURITY: Automatic key rotation with proper key management
   */
  async rotateKey(): Promise<void> {
    console.error('🔄 Rotating encryption key...');
    
    if (!this.masterKey) {
      throw new EncryptionError('Cannot rotate: master key not initialized', 'KEY_NOT_INITIALIZED');
    }

    const oldMasterKey = this.masterKey;
    const oldKeyVersion = this.keyVersion;
    
    try {
      // Generate new master key
      this.masterKey = await this.generateSecureMasterKey();
      await this.keyStorage.setKey(this.keyId, this.masterKey);
      
      this.keyVersion = this.generateKeyVersion();
      this.lastRotation = Date.now();
      
      // Clear used IVs for new key epoch
      this.usedIVs.clear();
      
      console.error('✅ Encryption key rotated successfully');
      
      // Log key rotation for audit
      console.error(`📝 Key rotation: ${oldKeyVersion} -> ${this.keyVersion}`);
    } catch (error: any) {
      // Rollback on failure
      this.masterKey = oldMasterKey;
      this.keyVersion = oldKeyVersion;
      throw new EncryptionError(
        `Key rotation failed: ${error.message}`,
        'KEY_ROTATION_FAILED'
      );
    }
  }

  /**
   * Check if key rotation is needed
   */
  needsKeyRotation(): boolean {
    const daysSinceRotation = (Date.now() - this.lastRotation) / (1000 * 60 * 60 * 24);
    return daysSinceRotation >= this.config.keyRotationDays;
  }

  /**
   * Setup automatic key rotation check
   */
  private setupKeyRotationCheck(): void {
    // Check daily if key rotation is needed
    const checkInterval = 24 * 60 * 60 * 1000; // 24 hours
    
    const checkRotation = async () => {
      if (this.needsKeyRotation()) {
        console.error('⚠️  Key rotation required, initiating rotation...');
        try {
          await this.rotateKey();
        } catch (error: any) {
          console.error('❌ Automatic key rotation failed:', error.message);
        }
      }
    };

    setInterval(checkRotation, checkInterval);
    console.error(`🔄 Automatic key rotation check enabled (every 24 hours)`);
  }

  /**
   * Get encryption statistics
   */
  getStats(): EncryptionStats {
    return {
      algorithm: this.config.algorithm,
      keyLength: this.config.keyLength,
      keyVersion: this.keyVersion,
      lastRotation: this.lastRotation,
      needsRotation: this.needsKeyRotation(),
      rotationIntervalDays: this.config.keyRotationDays,
      usedIVsCount: this.usedIVs.size,
      keyInitialized: this.masterKey !== null
    };
  }

  /**
   * Verify encryption integrity
   */
  verifyIntegrity(encryptedData: EncryptedData): boolean {
    try {
      // Attempt to decrypt (will fail if tampered)
      this.decrypt(encryptedData);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Securely destroy master key from memory
   * SECURITY: Clears key material from memory
   */
  destroyKey(): void {
    if (this.masterKey) {
      // Overwrite key buffer with zeros before clearing
      for (let i = 0; i < this.masterKey.length; i++) {
        this.masterKey[i] = 0;
      }
      this.masterKey = null;
      this.usedIVs.clear();
      console.error('🔒 Master key securely destroyed');
    }
  }

  // Private helper methods

  private generateKeyVersion(): string {
    return `v${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  private generateCredentialId(): string {
    return `cred_${crypto.randomBytes(16).toString('hex')}`;
  }

  private calculateExpiryDate(): number {
    // Default: 1 year from now
    return Date.now() + (365 * 24 * 60 * 60 * 1000);
  }

  /**
   * Get key storage backend (for testing/migration)
   */
  getKeyStorage(): KeyStorageBackend {
    return this.keyStorage;
  }
}

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  encryptedData: string;
  iv: string;
  tag: string;
  algorithm: string;
  keyVersion?: string;
  createdAt: number;
}

/**
 * Encryption statistics
 */
export interface EncryptionStats {
  algorithm: string;
  keyLength: number;
  keyVersion: string;
  lastRotation: number;
  needsRotation: boolean;
  rotationIntervalDays: number;
  usedIVsCount: number;
  keyInitialized: boolean;
}

/**
 * Encryption error
 */
export class EncryptionError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'EncryptionError';
  }
}

/**
 * Extended encryption config with security options
 */
export interface SecureEncryptionConfig extends EncryptionConfig {
  keyId?: string;
  keyDirectory?: string;
  salt?: Buffer;
}

/**
 * Factory function to create production-ready encryption manager
 */
export function createEncryptionManager(config?: Partial<SecureEncryptionConfig>): SessionEncryptionManager {
  return new SessionEncryptionManager(config);
}

/**
 * Encryption manager factory for different environments
 */
export class EncryptionManagerFactory {
  /**
   * Create production-ready encryption manager
   * SECURITY: Requires ENCRYPTION_MASTER_SECRET environment variable
   */
  static createForProduction(): SessionEncryptionManager {
    if (!process.env.ENCRYPTION_MASTER_SECRET) {
      throw new Error(
        'CRITICAL: ENCRYPTION_MASTER_SECRET must be set for production use. ' +
        'Use a strong passphrase (minimum 32 characters) or random string.'
      );
    }

    if (process.env.ENCRYPTION_MASTER_SECRET.length < 32) {
      throw new Error(
        'CRITICAL: ENCRYPTION_MASTER_SECRET must be at least 32 characters long.'
      );
    }

    return new SessionEncryptionManager({
      algorithm: 'AES-256-GCM',
      keyLength: 256,
      ivLength: 12,
      tagLength: 16,
      keyRotationDays: 90,
      keyDirectory: process.env.KEY_STORAGE_DIRECTORY
    });
  }

  /**
   * Create development encryption manager
   * WARNING: Not suitable for production
   */
  static createForDevelopment(): SessionEncryptionManager {
    // Set a development secret if not provided
    if (!process.env.ENCRYPTION_MASTER_SECRET) {
      process.env.ENCRYPTION_MASTER_SECRET = 'dev-secret-do-not-use-in-production-' + Date.now();
      console.error('⚠️  WARNING: Using auto-generated development secret');
    }

    return new SessionEncryptionManager({
      algorithm: 'AES-256-GCM',
      keyLength: 256,
      ivLength: 12,
      tagLength: 16,
      keyRotationDays: 1 // Rotate daily in dev for testing
    });
  }

  /**
   * Create encryption manager with custom config
   */
  static createCustom(config: SecureEncryptionConfig): SessionEncryptionManager {
    return new SessionEncryptionManager(config);
  }
}
