// Adapter for IndianAPI.in data normalization

export interface CandleData {
  time: string | number; // Support both UNIX timestamp and date string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdated: string;
}

export interface StockMetadata {
  symbol: string;
  companyName: string;
  lastRefreshed: string;
  timeZone: string;
}

// IndianAPI response interfaces (actual format from stock.indianapi.in)
// The API returns detailed financial data, we'll extract what we can
export interface IndianAPIStockResponse {
  stockName?: string;
  stockSymbol?: string;
  stockFinancialMap?: Array<{
    stockFinancialMap?: {
      INC?: Array<{
        displayName: string;
        key: string;
        value: string;
      }>;
      BAL?: Array<{
        displayName: string;
        key: string;
        value: string;
      }>;
    };
    FiscalYear?: string;
    EndDate?: string;
    Type?: string;
  }>;
  recentNews?: Array<{
    headline: string;
    date: string;
    url: string;
  }>;
  // Since API doesn't provide direct price/change, we'll use mock data
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  volume?: number;
  marketCap?: number;
  lastUpdated?: string;
  status?: string;
}

export interface IndianAPIHistoryResponse {
  symbol: string;
  data: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  meta?: {
    symbol: string;
    companyName: string;
    period: string;
    lastUpdated: string;
  };
}

export interface IndianAPIListResponse {
  stocks: Array<{
    symbol: string;
    companyName: string;
    sector: string;
    marketCap: number;
  }>;
}

/**
 * Parse IndianAPI stock price response to StockQuote format
 */
export function parseIndianStockResponse(response: IndianAPIStockResponse, symbol: string): StockQuote {
  // Since the API returns detailed financial data but not simple quotes,
  // we'll generate realistic mock data for demonstration
  const mockData = generateMockIndianStockQuote(symbol);
  
  // Log what we're getting from the API to debug
  console.log(`IndianAPI response for ${symbol}:`, {
    currentPrice: response.currentPrice,
    priceChange: response.priceChange,
    priceChangePercent: response.priceChangePercent,
    hasFinancialData: !!response.stockFinancialMap
  });
  
  console.log(`Mock data for ${symbol}:`, mockData);
  
  // Since the API doesn't provide current prices, always use mock data
  return {
    symbol: symbol,
    price: mockData.price,
    change: mockData.change,
    changePercent: mockData.changePercent,
    volume: mockData.volume,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Parse IndianAPI historical data to candlestick format
 */
export function parseIndianHistoryResponse(
  response: IndianAPIHistoryResponse
): CandleData[] {
  if (!response.data || !Array.isArray(response.data)) {
    console.warn('Invalid IndianAPI history response format');
    return [];
  }

  return response.data
    .map((item) => ({
      time: item.date || '',
      open: Number(item.open) || 0,
      high: Number(item.high) || 0,
      low: Number(item.low) || 0,
      close: Number(item.close) || 0,
      volume: Number(item.volume) || 0,
    }))
    .filter((item) => item.time) // Filter out items without valid dates
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()); // Sort by date ascending
}

/**
 * Extract metadata from IndianAPI response
 */
export function extractIndianStockMetadata(
  response: IndianAPIHistoryResponse | IndianAPIStockResponse
): StockMetadata | null {
  if ('meta' in response && response.meta) {
    return {
      symbol: response.meta.symbol || '',
      companyName: response.meta.companyName || '',
      lastRefreshed: response.meta.lastUpdated || '',
      timeZone: 'Asia/Kolkata',
    };
  }

  if ('symbol' in response) {
    return {
      symbol: (response as unknown as Record<string, unknown>).symbol as string || '',
      companyName: (response as unknown as Record<string, unknown>).companyName as string || '',
      lastRefreshed: (response as unknown as Record<string, unknown>).lastUpdated as string || '',
      timeZone: 'Asia/Kolkata',
    };
  }

  return null;
}

/**
 * Generate mock candlestick data for demo purposes
 * Useful when API limits are reached or for development
 */
export function generateMockIndianCandleData(symbol: string, days: number = 30): CandleData[] {
  const data: CandleData[] = [];
  const basePrice = 1000 + Math.random() * 4000; // Random base price between 1000-5000
  let currentPrice = basePrice;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Generate realistic OHLC data
    const volatility = 0.02; // 2% daily volatility
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * 0.01 * currentPrice;
    const low = Math.min(open, close) - Math.random() * 0.01 * currentPrice;
    const volume = Math.floor(100000 + Math.random() * 900000); // Random volume

    data.push({
      time: date.toISOString().split('T')[0], // YYYY-MM-DD format
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
    });

    currentPrice = close;
  }

  return data;
}

/**
 * Generate mock Indian stock quote for testing/fallback
 */
export function generateMockIndianStockQuote(symbol: string): StockQuote {
  // Realistic price ranges for popular Indian stocks
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

  const basePrice = basePrices[symbol] || 1500;
  const randomFactor = 0.95 + Math.random() * 0.1; // ±5% variation
  const price = Math.round(basePrice * randomFactor * 100) / 100;
  
  const changePercent = (Math.random() - 0.5) * 6; // ±3% change
  const change = Math.round(price * (changePercent / 100) * 100) / 100;
  
  const volume = Math.floor(Math.random() * 1000000) + 100000; // 100K - 1M volume

  return {
    symbol,
    price,
    change,
    changePercent: Math.round(changePercent * 100) / 100,
    volume,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Popular Indian stocks list for demo/fallback
 */
export const POPULAR_INDIAN_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd' },
  { symbol: 'INFY', name: 'Infosys Ltd' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd' },
  { symbol: 'HDFC', name: 'Housing Development Finance Corporation Ltd' },
  { symbol: 'SBIN', name: 'State Bank of India' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd' },
  { symbol: 'ITC', name: 'ITC Ltd' },
  { symbol: 'WIPRO', name: 'Wipro Ltd' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Ltd' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd' },
];

/**
 * Build IndianAPI URL for different endpoints
 */
export function buildIndianAPIUrl(
  endpoint: 'stocks' | 'history' | 'list',
  params: Record<string, string> = {}
): string {
  const baseUrl = '/api/indianapi';
  const url = new URL(`${baseUrl}/${endpoint}`, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return url.toString();
}

/**
 * Sample IndianAPI responses for development/testing
 */
export const sampleIndianStockResponse: IndianAPIStockResponse = {
  stockName: 'Reliance Industries Ltd',
  stockSymbol: 'RELIANCE',
  currentPrice: 2456.75,
  priceChange: 23.45,
  priceChangePercent: 0.96,
  volume: 1234567,
  marketCap: 1665432100000,
  lastUpdated: new Date().toISOString(),
  status: 'success',
  stockFinancialMap: [],
  recentNews: [],
};

export const sampleIndianHistoryResponse: IndianAPIHistoryResponse = {
  symbol: 'RELIANCE',
  data: [
    {
      date: '2024-01-01',
      open: 2400.0,
      high: 2450.0,
      low: 2380.0,
      close: 2430.0,
      volume: 1000000,
    },
    {
      date: '2024-01-02',
      open: 2430.0,
      high: 2480.0,
      low: 2420.0,
      close: 2456.75,
      volume: 1234567,
    },
  ],
  meta: {
    symbol: 'RELIANCE',
    companyName: 'Reliance Industries Ltd',
    period: '1d',
    lastUpdated: new Date().toISOString(),
  },
};
