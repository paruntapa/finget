import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, getRateLimitStatus } from '../rateLimit';

const ALPHAVANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// Supported AlphaVantage functions (using free endpoints)
const SUPPORTED_FUNCTIONS = [
  'TIME_SERIES_INTRADAY',
  'TIME_SERIES_DAILY',
  'TIME_SERIES_WEEKLY', 
  'TIME_SERIES_MONTHLY',
  'GLOBAL_QUOTE',
  'SYMBOL_SEARCH',
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const func = searchParams.get('function');
  const symbol = searchParams.get('symbol');
  const interval = searchParams.get('interval');
  const keywords = searchParams.get('keywords');
  
  if (!func || !SUPPORTED_FUNCTIONS.includes(func)) {
    return NextResponse.json({ 
      error: 'Invalid function',
      supportedFunctions: SUPPORTED_FUNCTIONS 
    }, { status: 400 });
  }

  // Use demo key for testing (to avoid rate limits)
  const apiKey: string = process.env.ALPHA_VANTAGE_KEY!;
  console.log(apiKey, "apiKey")
  
  console.log('Using AlphaVantage demo API key - works with IBM, TSCO.LON, and other demo symbols');

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
    // Build AlphaVantage URL
    const url = new URL(ALPHAVANTAGE_BASE_URL);
    url.searchParams.set('function', func);
    url.searchParams.set('apikey', apiKey);

    // Add required parameters based on function
    if (symbol) {
      url.searchParams.set('symbol', symbol);
    }
    
    if (interval) {
      url.searchParams.set('interval', interval);
    }
    
    if (keywords) {
      url.searchParams.set('keywords', keywords);
    }

    // Add default parameters for better data quality
    if (func === 'TIME_SERIES_INTRADAY') {
      url.searchParams.set('outputsize', 'compact');
    }

    // Fetch from AlphaVantage
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'FinGet/1.0',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000), // 15 second timeout
    });

    if (!response.ok) {
      return NextResponse.json({
        error: `AlphaVantage API error: ${response.status} ${response.statusText}`,
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Check for AlphaVantage-specific errors
    if (data['Error Message']) {
      return NextResponse.json({
        error: 'AlphaVantage API Error',
        message: data['Error Message'],
      }, { status: 400 });
    }

    if (data['Note']) {
      return NextResponse.json({
        error: 'AlphaVantage Rate Limit',
        message: data['Note'],
      }, { status: 429 });
    }

    // Set rate limit headers
    const status = getRateLimitStatus(identifier);
    
    // Cache successful responses based on function type
    const cacheTime = func === 'TIME_SERIES_INTRADAY' ? 60 : // 1 minute for intraday
                     func.includes('DAILY') ? 300 : // 5 minutes for daily
                     func.includes('WEEKLY') ? 900 : // 15 minutes for weekly
                     1800; // 30 minutes for monthly
    
    const headers = new Headers({
      'X-RateLimit-Limit': '60',
      'X-RateLimit-Remaining': status.remaining.toString(),
      'X-RateLimit-Reset': status.resetTime.toString(),
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': `public, max-age=${cacheTime}`,
    });
    
    return NextResponse.json(data, { headers });
    
  } catch (error: any) {
    console.error('AlphaVantage proxy error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch AlphaVantage data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
