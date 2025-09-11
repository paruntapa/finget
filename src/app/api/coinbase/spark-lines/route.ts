import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, getRateLimitStatus } from '../../rateLimit';

const COINBASE_API_BASE_URL = 'https://api.exchange.coinbase.com';

export async function GET(request: NextRequest) {
  // Rate limiting
  const clientIP = request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown';
  const identifier = clientIP.split(',')[0].trim();
  
  const rateLimitResult = rateLimitMiddleware(identifier);
  
  if (!rateLimitResult.allowed) {
    const status = getRateLimitStatus(identifier);
    const headers = new Headers({
      'X-RateLimit-Limit': '60',
      'X-RateLimit-Remaining': status.remaining.toString(),
      'X-RateLimit-Reset': status.resetTime.toString(),
      'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
    });
    
    return NextResponse.json({
      error: 'Rate limit exceeded',
      retryAfter: rateLimitResult.retryAfter,
    }, { status: 429, headers });
  }

  try {
    // Sparkline endpoint: /products/spark-lines
    const coinbaseUrl = `${COINBASE_API_BASE_URL}/products/spark-lines`;
    
    console.log(`Fetching from Coinbase: ${coinbaseUrl}`);

    // Fetch from Coinbase API
    const response = await fetch(coinbaseUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'FinGet-Dashboard/1.0',
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      throw new Error(`Coinbase API responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for Coinbase specific errors
    if (data.message) {
      return NextResponse.json({
        error: 'Coinbase API Error',
        message: data.message,
        data: data
      }, { status: 400 });
    }

    // Success response with cache headers
    const responseHeaders = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=30, stale-while-revalidate=60', // 30 sec cache
    });
    
    return NextResponse.json(data, { headers: responseHeaders });
    
  } catch (error: unknown) {
    console.error('Coinbase spark-lines proxy error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch Coinbase spark-lines data',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 });
  }
}
