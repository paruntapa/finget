import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, getRateLimitStatus } from '../../rateLimit';

const COINBASE_API_BASE_URL = 'https://api.exchange.coinbase.com';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const symbol = searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ 
      error: 'Missing required parameter: symbol' 
    }, { status: 400 });
  }

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
    const coinbaseUrl = `${COINBASE_API_BASE_URL}/products/${symbol}/candles`;
    
    const granularity = searchParams.get('granularity') || '3600'; 
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    
    const params = new URLSearchParams({ granularity });
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    
    const fullUrl = `${coinbaseUrl}?${params.toString()}`;
    
    console.log(`Fetching from Coinbase: ${fullUrl}`);

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'FinGet-Dashboard/1.0',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Coinbase API responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.message) {
      return NextResponse.json({
        error: 'Coinbase API Error',
        message: data.message,
        data: data
      }, { status: 400 });
    }

    const responseHeaders = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120', 
    });
    
    return NextResponse.json(data, { headers: responseHeaders });
    
  } catch (error: unknown) {
    console.error('Coinbase candles proxy error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch Coinbase candles data',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 });
  }
}
