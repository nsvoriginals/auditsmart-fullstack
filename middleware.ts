// middleware.ts - CREATE IN ROOT DIRECTORY
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auditRateLimit, authRateLimit, memoryRateLimit } from '@/lib/rate-limit';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const ip = request.ip ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
  const path = request.nextUrl.pathname;
  const method = request.method;

  // CORS headers for API routes
  if (path.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', 
      process.env.NODE_ENV === 'production' 
        ? 'https://zylithium.org' 
        : 'http://localhost:3000'
    );
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Handle OPTIONS preflight
    if (method === 'OPTIONS') {
      return new NextResponse(null, { 
        status: 200,
        headers: response.headers,
      });
    }
  }

  // B-01: Rate limit audit endpoints (5 per hour per IP)
  if (path.startsWith('/api/audit/scan') || path.startsWith('/api/audit/run')) {
    let success = true;
    let remaining = 0;
    let reset = 0;
    
    if (auditRateLimit) {
      // Use Upstash Redis
      const result = await auditRateLimit.limit(ip);
      success = result.success;
      remaining = result.remaining;
      reset = result.reset;
    } else {
      // Fallback to in-memory
      const result = memoryRateLimit(`audit:${ip}`, 5, 60 * 60 * 1000);
      success = result.success;
      remaining = result.remaining;
      reset = result.reset;
    }
    
    if (!success) {
      const resetDate = new Date(reset);
      const minutesLeft = Math.ceil((reset - Date.now()) / 1000 / 60);
      
      return NextResponse.json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Too many audit requests. Please try again in ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}.`,
        limit: 5,
        remaining: 0,
        reset: resetDate.toISOString(),
      }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetDate.toISOString(),
          'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
        },
      });
    }
    
    response.headers.set('X-RateLimit-Limit', '5');
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());
  }

  // B-01: Rate limit auth endpoints (10 per minute per IP)
  if (path.startsWith('/api/auth/') && method === 'POST') {
    let success = true;
    let reset = 0;
    
    if (authRateLimit) {
      const result = await authRateLimit.limit(`${ip}:auth`);
      success = result.success;
      reset = result.reset;
    } else {
      const result = memoryRateLimit(`auth:${ip}`, 10, 60 * 1000);
      success = result.success;
      reset = result.reset;
    }
    
    if (!success) {
      return NextResponse.json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please try again in 1 minute.',
      }, { 
        status: 429,
        headers: {
          'Retry-After': '60',
        },
      });
    }
  }

  // C-04: Force HTTPS in production
  if (process.env.NODE_ENV === 'production' && request.headers.get('x-forwarded-proto') === 'http') {
    const httpsUrl = request.nextUrl.toString().replace('http://', 'https://');
    return NextResponse.redirect(httpsUrl, 301);
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  // Only run middleware on API routes.
  // Previously matched /dashboard/* and /checkout/* which added CORS/rate-limit
  // overhead to every page navigation — that's what was causing the 200-400ms
  // latency on every route change.
  matcher: ['/api/:path*'],
};