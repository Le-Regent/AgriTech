import { NextResponse } from 'next/server';
import { initiateWithdrawal } from '@/lib/payments/campay';
import { withdrawSchema } from '@/lib/validations/payment';
import { handleRateLimit } from '@/lib/security/rateLimit';
import { logger } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    const rateLimitResponse = handleRateLimit(ip, 3, 60000);
    if (rateLimitResponse) {
      logger.warn('Rate limit exceeded for withdraw API', { ip });
      return rateLimitResponse;
    }

    const body = await req.json();
    const validation = withdrawSchema.safeParse(body);
    if (!validation.success) {
      logger.warn('Validation failed for withdraw API', { errors: validation.error.format() });
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.error.format() 
      }, { status: 400 });
    }

    const { amount, phoneNumber, externalId } = validation.data;
    logger.info('Initiating withdrawal', { amount, phoneNumber, externalId });

    const result = await initiateWithdrawal(amount, phoneNumber, externalId);
    logger.info('Withdrawal initiated successfully', { result });
    return NextResponse.json(result);
  } catch (error: any) {
    logger.error('API Payment Withdrawal Error', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
