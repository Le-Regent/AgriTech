import { NextResponse } from 'next/server';
import { checkTransactionStatus } from '@/lib/payments/campay';
import { statusSchema } from '@/lib/validations/payment';
import { handleRateLimit } from '@/lib/security/rateLimit';
import { logger } from '@/lib/logger';

export async function GET(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResponse = handleRateLimit(ip, 20, 60000);
    if (rateLimitResponse) {
      logger.warn('Rate limit exceeded for status API', { ip });
      return rateLimitResponse;
    }

    const { searchParams } = new URL(req.url);
    const reference = searchParams.get('reference');

    const validation = statusSchema.safeParse({ reference });
    if (!validation.success) {
      logger.warn('Validation failed for status API', { errors: validation.error.format() });
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.format() 
      }, { status: 400 });
    }

    logger.info('Checking transaction status', { reference: validation.data.reference });
    const result = await checkTransactionStatus(validation.data.reference);
    logger.info('Status check completed', { reference, status: result.status });
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('API Payment Status Error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
