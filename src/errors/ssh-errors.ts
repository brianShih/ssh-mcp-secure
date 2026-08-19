/**
 * SSH Error Handler
 * SSH 錯誤處理器
 * 
 * Features:
 * - Structured error types
 * - Error codes
 * - Stack traces
 * - Context preservation
 */

import { SSHError, SSHErrorCode } from '../types.js';

/**
 * Base SSH Error class
 */
export class SSHBaseError extends Error implements SSHError {
  public code: SSHErrorCode;
  public host?: string;
  public port?: number;
  public username?: string;
  public sessionId?: string;
  public timestamp: number;
  public cause?: Error;
  public context?: Record<string, any>;

  constructor(
    message: string,
    code: SSHErrorCode,
    host?: string,
    port?: number,
    username?: string,
    cause?: Error,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'SSHBaseError';
    this.code = code;
    this.host = host;
    this.port = port;
    this.username = username;
    this.timestamp = Date.now();
    this.cause = cause;
    this.context = context;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      host: this.host,
      port: this.port,
      username: this.username,
      sessionId: this.sessionId,
      timestamp: this.timestamp,
      stack: this.stack,
      context: this.context
    };
  }
}

/**
 * SSH Connection Error
 */
export class SSHConnectionError extends SSHBaseError {
  constructor(
    message: string,
    host: string,
    port: number,
    cause?: Error,
    context?: Record<string, any>
  ) {
    super(
      message,
      'CONNECTION_FAILED',
      host,
      port,
      undefined,
      cause,
      context
    );
    this.name = 'SSHConnectionError';
  }
}

/**
 * SSH Authentication Error
 */
export class SSHAuthenticationError extends SSHBaseError {
  constructor(
    message: string,
    public authMethod: string,
    username: string,
    context?: Record<string, any>
  ) {
    super(
      message,
      'AUTHENTICATION_FAILED',
      undefined,
      undefined,
      username,
      undefined,
      context
    );
    this.name = 'SSHAuthenticationError';
    this.authMethod = authMethod;
  }
}

/**
 * SSH Command Error
 */
export class SSHCommandError extends SSHBaseError {
  constructor(
    message: string,
    public command: string,
    public exitCode?: number,
    sessionId?: string,
    context?: Record<string, any>
  ) {
    super(
      message,
      'COMMAND_FAILED',
      undefined,
      undefined,
      undefined,
      undefined,
      context
    );
    this.name = 'SSHCommandError';
    this.command = command;
    this.exitCode = exitCode;
    this.sessionId = sessionId;
  }
}

/**
 * SSH Session Error
 */
export class SSHSessionError extends SSHBaseError {
  constructor(
    message: string,
    sessionId: string,
    context?: Record<string, any>
  ) {
    super(
      message,
      'SESSION_NOT_FOUND',
      undefined,
      undefined,
      undefined,
      undefined,
      context
    );
    this.name = 'SSHSessionError';
    this.sessionId = sessionId;
  }
}

/**
 * SSH File Transfer Error
 */
export class SSHFileTransferError extends SSHBaseError {
  constructor(
    message: string,
    public filePath: string,
    public operation: 'upload' | 'download' | 'read' | 'write',
    sessionId?: string,
    context?: Record<string, any>
  ) {
    super(
      message,
      'FILE_TRANSFER_FAILED',
      undefined,
      undefined,
      undefined,
      undefined,
      context
    );
    this.name = 'SSHFileTransferError';
    this.filePath = filePath;
    this.operation = operation;
    this.sessionId = sessionId;
  }
}

/**
 * Encryption Error
 */
export class SSHEncryptionError extends SSHBaseError {
  constructor(
    message: string,
    public operation: 'encrypt' | 'decrypt' | 'key_rotation',
    context?: Record<string, any>
  ) {
    super(
      message,
      'ENCRYPTION_ERROR',
      undefined,
      undefined,
      undefined,
      undefined,
      context
    );
    this.name = 'SSHEncryptionError';
    this.operation = operation;
  }
}

/**
 * MFA Verification Error
 */
export class SSHMFAError extends SSHBaseError {
  constructor(
    message: string,
    public attemptsRemaining?: number,
    context?: Record<string, any>
  ) {
    super(
      message,
      'MFA_VERIFICATION_FAILED',
      undefined,
      undefined,
      undefined,
      undefined,
      context
    );
    this.name = 'SSHMFAError';
    this.attemptsRemaining = attemptsRemaining;
  }
}

/**
 * Permission Denied Error
 */
export class SSHPermissionError extends SSHBaseError {
  constructor(
    message: string,
    public resource: string,
    public requiredPermission: string,
    userId?: string,
    context?: Record<string, any>
  ) {
    super(
      message,
      'PERMISSION_DENIED',
      undefined,
      undefined,
      userId,
      undefined,
      context
    );
    this.name = 'SSHPermissionError';
    this.resource = resource;
    this.requiredPermission = requiredPermission;
  }
}

/**
 * Rate Limit Error
 */
export class SSHRateLimitError extends SSHBaseError {
  constructor(
    message: string,
    public retryAfter?: number,
    context?: Record<string, any>
  ) {
    super(
      message,
      'RATE_LIMIT_EXCEEDED',
      undefined,
      undefined,
      undefined,
      undefined,
      context
    );
    this.name = 'SSHRateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * SSH Error Handler - Singleton
 */
export class SSHErrorHandler {
  private static instance: SSHErrorHandler;
  private errorHandlers: Map<SSHErrorCode, ErrorHandler[]> = new Map();
  private globalHandlers: ErrorHandler[] = [];

  private constructor() {}

  static getInstance(): SSHErrorHandler {
    if (!SSHErrorHandler.instance) {
      SSHErrorHandler.instance = new SSHErrorHandler();
    }
    return SSHErrorHandler.instance;
  }

  /**
   * Register error handler for specific error code
   */
  registerHandler(
    code: SSHErrorCode,
    handler: ErrorHandler
  ): void {
    if (!this.errorHandlers.has(code)) {
      this.errorHandlers.set(code, []);
    }
    this.errorHandlers.get(code)!.push(handler);
  }

  /**
   * Register global error handler
   */
  registerGlobalHandler(handler: ErrorHandler): void {
    this.globalHandlers.push(handler);
  }

  /**
   * Handle SSH error
   */
  async handleError(error: SSHBaseError): Promise<void> {
    // Call specific handlers
    const handlers = this.errorHandlers.get(error.code) || [];
    
    // Call global handlers
    const allHandlers = [...handlers, ...this.globalHandlers];
    
    for (const handler of allHandlers) {
      try {
        await handler(error);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    }
    
    // Log error
    this.logError(error);
  }

  /**
   * Log error
   */
  private logError(error: SSHBaseError): void {
    console.error('❌ SSH Error:', {
      name: error.name,
      code: error.code,
      message: error.message,
      host: error.host,
      port: error.port,
      username: error.username,
      sessionId: error.sessionId,
      timestamp: error.timestamp,
      stack: error.stack
    });
  }

  /**
   * Wrap promise with error handling
   */
  wrap<T>(
    promise: Promise<T>,
    errorCode: SSHErrorCode,
    defaultMessage: string
  ): Promise<T> {
    return promise.catch((error: any) => {
      throw new SSHBaseError(
        error.message || defaultMessage,
        errorCode,
        undefined,
        undefined,
        undefined,
        error
      );
    });
  }

  /**
   * Create error from code
   */
  createError(
    code: SSHErrorCode,
    message: string,
    context?: Record<string, any>
  ): SSHBaseError {
    switch (code) {
      case 'CONNECTION_FAILED':
        return new SSHConnectionError(
          message,
          context?.host || 'unknown',
          context?.port || 22
        );
      case 'AUTHENTICATION_FAILED':
        return new SSHAuthenticationError(
          message,
          context?.authMethod || 'unknown',
          context?.username || 'unknown'
        );
      case 'COMMAND_FAILED':
        return new SSHCommandError(
          message,
          context?.command || 'unknown',
          context?.exitCode
        );
      case 'SESSION_NOT_FOUND':
        return new SSHSessionError(
          message,
          context?.sessionId || 'unknown'
        );
      case 'FILE_TRANSFER_FAILED':
        return new SSHFileTransferError(
          message,
          context?.filePath || 'unknown',
          context?.operation || 'unknown'
        );
      case 'ENCRYPTION_ERROR':
        return new SSHEncryptionError(
          message,
          context?.operation || 'unknown'
        );
      case 'MFA_VERIFICATION_FAILED':
        return new SSHMFAError(
          message,
          context?.attemptsRemaining
        );
      case 'PERMISSION_DENIED':
        return new SSHPermissionError(
          message,
          context?.resource || 'unknown',
          context?.requiredPermission || 'unknown'
        );
      case 'RATE_LIMIT_EXCEEDED':
        return new SSHRateLimitError(
          message,
          context?.retryAfter
        );
      default:
        return new SSHBaseError(message, code);
    }
  }
}

/**
 * Error handler function type
 */
export type ErrorHandler = (error: SSHBaseError) => Promise<void>;

/**
 * Create SSH error handler instance
 */
export function createSSHErrorHandler(): SSHErrorHandler {
  return SSHErrorHandler.getInstance();
}
