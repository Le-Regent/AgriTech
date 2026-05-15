import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    // Here you could add database connectivity checks or other service dependencies
    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    };

    logger.info('Health check performmed', status);
    return NextResponse.json(status);
  } catch (error) {
    logger.error('Health check failed', error);
    return NextResponse.json({ status: 'unhealthy', error: 'Internal Server Error' }, { status: 500 });
  }
}
