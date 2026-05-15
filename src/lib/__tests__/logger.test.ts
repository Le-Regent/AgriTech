import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  const consoleSpy = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log info messages in development', () => {
    // Force development environment if needed, but logger usually checks process.env.NODE_ENV
    logger.info('test info');
    expect(consoleSpy.log).toHaveBeenCalled();
  });

  it('should log error messages with objects', () => {
    const err = new Error('test error');
    logger.error('error occurred', { err });
    expect(consoleSpy.error).toHaveBeenCalled();
  });

  it('should log warning messages', () => {
    logger.warn('test warn');
    expect(consoleSpy.warn).toHaveBeenCalled();
  });

  it('should not log debug in production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    logger.debug('test debug');
    expect(consoleSpy.debug).not.toHaveBeenCalled();
    process.env.NODE_ENV = originalEnv;
  });
});
