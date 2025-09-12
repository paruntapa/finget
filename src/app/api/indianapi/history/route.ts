import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, getRateLimitStatus } from '../../rateLimit';

function generateMockHistoricalData(symbol: string, period: string) {
  const days = period === '1d' ? 30 : period === '1w' ? 90 : 365;
  const data = [];
  
  const basePrices: Record<string, number> = {
    'RELIANCE': 2850,
    'TCS': 4200,
    'HDFCBANK': 1650,
    'INFY': 1800,
    'ICICIBANK': 1250,
    'HINDUNILVR': 2400,
    'ITC': 480,
    'KOTAKBANK': 1750,
    'LT': 3500,
    'BHARTIARTL': 1600,
  };
  
  let currentPrice = basePrices[symbol] || 1500;
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const change = (Math.random() - 0.5) * 0.06; 
    currentPrice = currentPrice * (1 + change);
    
    const open = currentPrice * (0.98 + Math.random() * 0.04);
    const close = currentPrice * (0.98 + Math.random() * 0.04);
    const high = Math.max(open, close) * (1 + Math.random() * 0.02);
    const low = Math.min(open, close) * (1 - Math.random() * 0.02);
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: volume
    });
  }
  
  return {
    symbol: symbol,
    data: data,
    period: period,
    status: 'success'
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const symbol = searchParams.get('symbol');
  const period = searchParams.get('period') || '1d';
  
  if (!symbol) {
    return NextResponse.json({ 
      error: 'Missing required parameter: symbol' 
    }, { status: 400 });
  }

  const apiKey = process.env.INDIAN_STOCK_API;
  if (!apiKey) {
    return NextResponse.json({ 
      error: 'IndianAPI key not configured',
      message: 'Please set INDIAN_STOCK_API environment variable'
    }, { status: 500 });
  }

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
    console.log(`Generating mock historical data for ${symbol} with period ${period}`);

    const mockHistoryData = generateMockHistoricalData(symbol, period);

    const responseHeaders = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600', 
    });
    
    return NextResponse.json(mockHistoryData, { headers: responseHeaders });
    
  } catch (error: unknown) {
    console.error('IndianAPI history proxy error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch IndianAPI history data',
      details: process.env.NODE_ENV === 'development' && error instanceof Error ? error.message : undefined
    }, { status: 500 });
  }
}
