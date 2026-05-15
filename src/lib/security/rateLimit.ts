import { NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export function rateLimit(ip: string, options: RateLimitOptions) {
  const currentTime = Date.now();
  
  if (!store[ip] || currentTime > store[ip].resetTime) {
    store[ip] = {
      count: 1,
      resetTime: currentTime + options.windowMs,
    };
    return { success: true, remaining: options.limit - 1 };
  }

  store[ip].count++;

  if (store[ip].count > options.limit) {
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: options.limit - store[ip].count };
}

export function handleRateLimit(ip: string, limit: number = 10, windowMs: number = 60000) {
  const result = rateLimit(ip, { limit, windowMs });
  
  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'Retry-After': (windowMs / 1000).toString(),
        }
      }
    );
  }
  
  return null;
}
