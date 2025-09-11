import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, getRateLimitStatus } from '../../rateLimit';

const INDIAN_API_BASE_URL = 'https://stock.indianapi.in';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Get required symbol parameter
  const symbol = searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ 
      error: 'Missing required parameter: symbol' 
    }, { status: 400 });
  }

  // Get API key from environment
  const apiKey = process.env.INDIAN_STOCK_API;
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'IndianAPI key not configured',
      message: 'Please set INDIAN_STOCK_API environment variable'
    }, { status: 500 });
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
    // Build IndianAPI URL for stock endpoint (singular, uses 'name' parameter)
    const url = new URL(`${INDIAN_API_BASE_URL}/stock`);
    url.searchParams.set('name', symbol);

    console.log(`Fetching from IndianAPI: ${url.toString()}`);

    // Fetch from IndianAPI with API key in headers
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FinGet-Dashboard/1.0',
        'X-Api-Key': apiKey,
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`IndianAPI error response: ${errorText}`);
      console.log((`IndianAPI responded with ${response.status}: ${response.statusText}`));
      throw new Error(`IndianAPI responded with ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check for IndianAPI specific errors
    if (data.error || data.Error) {
      return NextResponse.json({
        error: 'IndianAPI Error',
        message: data.error || data.Error || 'Unknown API error',
        data: data
      }, { status: 400 });
    }

    // Success response with cache headers
    const responseHeaders = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=120', // 1 min cache, 2 min stale
    });
    
    return NextResponse.json(data, { headers: responseHeaders });
    
  } catch (error: unknown) {
    console.error('IndianAPI stocks proxy error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch IndianAPI stocks data',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 });
  }
}
