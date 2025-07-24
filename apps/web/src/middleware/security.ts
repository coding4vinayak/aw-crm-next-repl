import { NextRequest, NextResponse } from 'next/server';
import { SecurityService } from '@/lib/security';

// Security headers middleware
export function securityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS (HTTP Strict Transport Security)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  return response;
}

// Rate limiting middleware
export async function rateLimitMiddleware(
  request: NextRequest,
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): Promise<NextResponse | null> {
  const rateLimit = await SecurityService.checkRateLimit(identifier, maxRequests, windowMs);

  if (!rateLimit.allowed) {
    const response = NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    );
    
    response.headers.set('X-RateLimit-Limit', maxRequests.toString());
    response.headers.set('X-RateLimit-Remaining', '0');
    response.headers.set('X-RateLimit-Reset', rateLimit.resetTime.toISOString());
    
    return response;
  }

  return null;
}

// IP-based security checks
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.ip || 'unknown';
}

// Suspicious activity detection
export async function detectSuspiciousActivity(
  request: NextRequest,
  userId?: string
): Promise<boolean> {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /hack/i,
    /exploit/i,
  ];
  
  const isSuspiciousUserAgent = suspiciousPatterns.some(pattern => 
    pattern.test(userAgent)
  );
  
  // Check for rapid requests from same IP
  const rapidRequestLimit = await SecurityService.checkRateLimit(
    `suspicious:${ip}`,
    50, // 50 requests
    60 * 1000 // in 1 minute
  );
  
  if (isSuspiciousUserAgent || !rapidRequestLimit.allowed) {
    if (userId) {
      await SecurityService.logSecurityEvent(
        userId,
        'SUSPICIOUS_ACTIVITY',
        'HIGH',
        {
          ip,
          userAgent,
          reason: isSuspiciousUserAgent ? 'Suspicious user agent' : 'Rapid requests',
        },
        ip,
        userAgent
      );
    }
    
    return true;
  }
  
  return false;
}

// CSRF protection
export function validateCSRFToken(request: NextRequest): boolean {
  if (request.method === 'GET') {
    return true; // GET requests don't need CSRF protection
  }
  
  const token = request.headers.get('x-csrf-token');
  const cookie = request.cookies.get('csrf-token')?.value;
  
  return token === cookie && token !== null;
}

// Input validation middleware
export function validateInput(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for common injection patterns
  const injectionPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
  ];
  
  function checkValue(value: any, path: string = ''): void {
    if (typeof value === 'string') {
      injectionPatterns.forEach(pattern => {
        if (pattern.test(value)) {
          errors.push(`Potentially malicious content detected in ${path || 'input'}`);
        }
      });
    } else if (typeof value === 'object' && value !== null) {
      Object.keys(value).forEach(key => {
        checkValue(value[key], path ? `${path}.${key}` : key);
      });
    }
  }
  
  checkValue(data);
  
  return {
    valid: errors.length === 0,
    errors,
  };
}