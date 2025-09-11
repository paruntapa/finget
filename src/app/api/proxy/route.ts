import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, getRateLimitStatus } from '../rateLimit';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  // Rate limiting based on IP
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
    // Generic proxy for custom URLs only
    if (!url) {
      return NextResponse.json({ error: 'URL parameter required' }, { status: 400 });
    }
    
    let targetUrl: string;
    try {
      new URL(url); // Validate URL format
      targetUrl = url;
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Fetch data from target URL
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'FinGet/1.0',
        'Accept': 'application/json',
      },
      // Add timeout
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      return NextResponse.json({
        error: `Upstream API error: ${response.status} ${response.statusText}`,
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Set rate limit headers for client
    const status = getRateLimitStatus(identifier);
    
    const headers = new Headers({
      'X-RateLimit-Limit': '60',
      'X-RateLimit-Remaining': status.remaining.toString(),
      'X-RateLimit-Reset': status.resetTime.toString(),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=300', // Cache response for 5 minutes
    });
    
    return NextResponse.json(data, { headers });
    
  } catch (error: any) {
    console.error('Proxy error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch data',
      details: error.message 
    }, { status: 500 });
  }
}
