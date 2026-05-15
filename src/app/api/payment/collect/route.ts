import { NextResponse } from 'next/server';
import { initiateCollect } from '@/lib/payments/campay';
import { collectSchema } from '@/lib/validations/payment';
import { handleRateLimit } from '@/lib/security/rateLimit';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResponse = handleRateLimit(ip, 5, 60000);
    if (rateLimitResponse) {
      logger.warn('Rate limit exceeded for collect API', { ip });
      return rateLimitResponse;
    }

    const body = await req.json();
    const validation = collectSchema.safeParse(body);
    
    if (!validation.success) {
      logger.warn('Validation failed for collect API', { errors: validation.error.format() });
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const { amount, phoneNumber, externalId } = validation.data;
    logger.info('Initiating payment collect', { amount, phoneNumber, externalId });

    const result = await initiateCollect(amount, phoneNumber, externalId);
    logger.info('Payment collect initiated successfully', { result });
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('API Payment Collect Error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
