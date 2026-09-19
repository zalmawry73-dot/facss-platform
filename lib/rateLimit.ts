import { NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

const stores = new Map<string, Map<string, RateLimitRecord>>();

// Automatic cleanup every 5 minutes to prevent memory leak
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    stores.forEach((store) => {
      store.forEach((record, key) => {
        if (now > record.resetTime) {
          store.delete(key);
        }
      });
    });
  }, 5 * 60 * 1000);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

export function checkRateLimit(
  request: Request,
  limiterName: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number } {
  let store = stores.get(limiterName);
  if (!store) {
    store = new Map<string, RateLimitRecord>();
    stores.set(limiterName, store);
  }

  const ip = getClientIp(request);
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  const record = store.get(ip);

  if (!record || now > record.resetTime) {
    store.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime,
  };
}

export function rateLimitResponse(resetTime: number) {
  const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
  return NextResponse.json(
    {
      error: 'تم تجاوز الحد المسموح به من المحاولات، يرجى الانتظار قليلاً والمحاولة لاحقاً.',
      retryAfterSeconds: retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}

// Preset Limiters
export const LIMITERS = {
  LOGIN: { maxRequests: 5, windowSeconds: 60 },        // 5 per minute
  REGISTER: { maxRequests: 3, windowSeconds: 3600 },    // 3 per hour
  CONTACT: { maxRequests: 5, windowSeconds: 600 },      // 5 per 10 minutes
  REQUESTS: { maxRequests: 10, windowSeconds: 3600 },   // 10 per hour
};
