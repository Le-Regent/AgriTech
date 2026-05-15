type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: any;
  error?: any;
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: any, error?: any): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : error
    };
  }

  private print(entry: LogEntry) {
    const output = JSON.stringify(entry);
    switch (entry.level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      default:
        console.log(output);
    }
  }

  info(message: string, context?: any) {
    this.print(this.formatLog('info', message, context));
  }

  warn(message: string, context?: any) {
    this.print(this.formatLog('warn', message, context));
  }

  error(message: string, error?: any, context?: any) {
    this.print(this.formatLog('error', message, context, error));
  }

  debug(message: string, context?: any) {
    if (process.env.NODE_ENV !== 'production') {
      this.print(this.formatLog('debug', message, context));
    }
  }
}

export const logger = new Logger();
