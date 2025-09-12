export interface CandleData {
  time: string | number; 
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CryptoQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  lastUpdated: string;
}

export interface CryptoMetadata {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  lastRefreshed: string;
}

export interface CoinbaseSparkLineResponse {
  [symbol: string]: Array<[number, number, number, number, number]>; 
}

export type CoinbaseCandleResponse = Array<[number, number, number, number, number, number]>;

export function parseCoinbaseSparkLines(response: CoinbaseSparkLineResponse): CryptoQuote[] {
  const quotes: CryptoQuote[] = [];

  Object.entries(response).forEach(([symbol, sparklineData]) => {
    if (!sparklineData || sparklineData.length < 2) return;

    const latestCandle = sparklineData[0]; 
    const previousCandle = sparklineData[1]; 

    if (!latestCandle || !previousCandle) return;

    const [timestamp, , , , close] = latestCandle;
    const previousClose = previousCandle[4]; 

    const change = close - previousClose;
    const changePercent = previousClose !== 0 ? (change / previousClose) * 100 : 0;

    quotes.push({
      symbol,
      price: close,
      change,
      changePercent,
      volume: 0, 
      lastUpdated: new Date(timestamp * 1000).toISOString(),
    });
  });

  return quotes;
}

export function parseCoinbaseCandles(
  response: CoinbaseCandleResponse
): CandleData[] {
  if (!Array.isArray(response)) {
    console.warn('Invalid Coinbase candles response format');
    return [];
  }

  const candleData = response
    .map((candle) => {
      if (!Array.isArray(candle) || candle.length < 6) return null;

      const [timestamp, low, high, open, close, volume] = candle;

      return {
        time: timestamp, 
        open: Number(open),
        high: Number(high),
        low: Number(low),
        close: Number(close),
        volume: Number(volume),
      };
    })
    .filter(candle => candle !== null)
    .sort((a, b) => {
      const aTime = typeof a.time === 'number' ? a.time * 1000 : new Date(a.time).getTime();
      const bTime = typeof b.time === 'number' ? b.time * 1000 : new Date(b.time).getTime();
      return aTime - bTime;
    }); 

  return candleData;
}

export function extractCryptoMetadata(symbol: string): CryptoMetadata {
  const [baseCurrency, quoteCurrency] = symbol.split('-');
  
  return {
    symbol,
    baseCurrency: baseCurrency || '',
    quoteCurrency: quoteCurrency || 'USD',
    lastRefreshed: new Date().toISOString(),
  };
}

export function generateMockCryptoData(symbol: string, days: number = 30): CandleData[] {
  const data: CandleData[] = [];
  
  const basePrices: Record<string, number> = {
    'BTC-USD': 45000,
    'ETH-USD': 3200,
    'SOL-USD': 120,
    'ADA-USD': 0.85,
    'DOT-USD': 25,
    'MATIC-USD': 1.2,
    'AVAX-USD': 85,
    'ATOM-USD': 18,
  };

  const basePrice = basePrices[symbol] || 100;
  let currentPrice = basePrice;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const volatility = 0.05; 
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * 0.02 * currentPrice;
    const low = Math.min(open, close) - Math.random() * 0.02 * currentPrice;
    const volume = Math.floor(1000 + Math.random() * 9000); 

    data.push({
      time: date.toISOString().split('T')[0], 
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

export const POPULAR_CRYPTO_PAIRS = [
  { symbol: 'BTC-USD', name: 'Bitcoin', category: 'Layer 1' },
  { symbol: 'ETH-USD', name: 'Ethereum', category: 'Layer 1' },
  { symbol: 'SOL-USD', name: 'Solana', category: 'Layer 1' },
  { symbol: 'ADA-USD', name: 'Cardano', category: 'Layer 1' },
  { symbol: 'DOT-USD', name: 'Polkadot', category: 'Layer 0' },
  { symbol: 'MATIC-USD', name: 'Polygon', category: 'Layer 2' },
  { symbol: 'AVAX-USD', name: 'Avalanche', category: 'Layer 1' },
  { symbol: 'ATOM-USD', name: 'Cosmos', category: 'Layer 0' },
];

export const COINBASE_GRANULARITIES = {
  '1m': { seconds: 60, label: '1 Minute' },
  '5m': { seconds: 300, label: '5 Minutes' },
  '15m': { seconds: 900, label: '15 Minutes' },
  '1h': { seconds: 3600, label: '1 Hour' },
  '6h': { seconds: 21600, label: '6 Hours' },
  '1d': { seconds: 86400, label: '1 Day' },
} as const;

export type GranularityKey = keyof typeof COINBASE_GRANULARITIES;

export function buildCoinbaseUrl(
  endpoint: 'spark-lines' | 'candles',
  params: Record<string, string> = {}
): string {
  const baseUrl = '/api/coinbase';
  const url = new URL(`${baseUrl}/${endpoint}`, window.location.origin);
  
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return url.toString();
}

export function formatCryptoPrice(price: number): string {
  if (price >= 1000) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  } else if (price >= 1) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } else {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6,
    }).format(price);
  }
}

export const sampleCoinbaseSparkLineResponse: CoinbaseSparkLineResponse = {
  'BTC-USD': [
    [Date.now() / 1000, 45000, 45500, 44800, 45200],
    [Date.now() / 1000 - 300, 44800, 45100, 44700, 45000],
  ],
  'ETH-USD': [
    [Date.now() / 1000, 3200, 3250, 3180, 3220],
    [Date.now() / 1000 - 300, 3180, 3210, 3160, 3200],
  ],
  'SOL-USD': [
    [Date.now() / 1000, 120, 125, 118, 122],
    [Date.now() / 1000 - 300, 118, 121, 117, 120],
  ],
};

export const sampleCoinbaseCandleResponse: CoinbaseCandleResponse = [
  [Date.now() / 1000, 44800, 45200, 45000, 45100, 1234.56], // [timestamp, low, high, open, close, volume]
  [Date.now() / 1000 - 3600, 44500, 45000, 44700, 44800, 2345.67],
  [Date.now() / 1000 - 7200, 44200, 44700, 44300, 44500, 3456.78],
];
