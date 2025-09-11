export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface AlphaVantageResponse {
  'Meta Data': {
    '1. Information': string;
    '2. Symbol': string;
    '3. Last Refreshed': string;
    '4. Interval'?: string;
    '5. Output Size'?: string;
    '6. Time Zone': string;
  };
  [timeSeriesKey: string]: any;
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
  name?: string;
  lastRefreshed: string;
  timeZone: string;
  interval?: string;
}

export function parseTimeSeriesAlphaVantage(
  response: AlphaVantageResponse,
  interval: string = '5min'
): CandleData[] {
  // Find the time series data key (varies by interval)
  const timeSeriesKeys = Object.keys(response).filter(key => 
    key.includes('Time Series')
  );
  
  if (timeSeriesKeys.length === 0) {
    console.warn('No time series data found in AlphaVantage response');
    return [];
  }

  const timeSeriesData = response[timeSeriesKeys[0]];
  
  if (!timeSeriesData) {
    console.warn('Time series data is empty');
    return [];
  }

  const candleData: CandleData[] = [];
  
  for (const [timestamp, values] of Object.entries(timeSeriesData)) {
    const typedValues = values as {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
      '5. adjusted close'?: string;
      '6. volume'?: string;
      '7. dividend amount'?: string;
      '8. split coefficient'?: string;
    };

    candleData.push({
      time: timestamp,
      open: parseFloat(typedValues['1. open']),
      high: parseFloat(typedValues['2. high']),
      low: parseFloat(typedValues['3. low']),
      close: parseFloat(typedValues['4. close'] || typedValues['5. adjusted close'] || '0'),
      volume: parseFloat(typedValues['5. volume'] || typedValues['6. volume'] || '0'),
    });
  }

  // Sort by time (AlphaVantage returns newest first, we want oldest first)
  return candleData.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}

export function parseIntradayToStockQuotes(response: AlphaVantageResponse): StockQuote[] {
  const timeSeriesKeys = Object.keys(response).filter(key => 
    key.includes('Time Series')
  );
  
  if (timeSeriesKeys.length === 0 || !response['Meta Data']) {
    return [];
  }

  const timeSeriesData = response[timeSeriesKeys[0]];
  const metaData = response['Meta Data'];
  const symbol = metaData['2. Symbol'];
  
  // Get latest and previous data points for change calculation
  const timestamps = Object.keys(timeSeriesData).sort((a: any, b) => 
    new Date(b).getTime() - new Date(a.time).getTime()
  );
  
  if (timestamps.length < 2) return [];
  
  const latestData = timeSeriesData[timestamps[0]];
  const previousData = timeSeriesData[timestamps[1]];
  
  const currentPrice = parseFloat(latestData['4. close']);
  const previousPrice = parseFloat(previousData['4. close']);
  const change = currentPrice - previousPrice;
  const changePercent = (change / previousPrice) * 100;
  
  return [{
    symbol,
    price: currentPrice,
    change,
    changePercent,
    volume: parseFloat(latestData['5. volume']),
    lastUpdated: timestamps[0],
  }];
}

export function extractStockMetadata(response: AlphaVantageResponse): StockMetadata | null {
  if (!response['Meta Data']) return null;
  
  const metaData = response['Meta Data'];
  return {
    symbol: metaData['2. Symbol'],
    lastRefreshed: metaData['3. Last Refreshed'],
    timeZone: metaData['6. Time Zone'],
    interval: metaData['4. Interval'],
  };
}

export function buildAlphaVantageUrl(
  symbol: string,
  interval: string = '5min',
  apiKey: string
): string {
  const baseUrl = 'https://www.alphavantage.co/query';
  const params = new URLSearchParams({
    function: 'TIME_SERIES_INTRADAY',
    symbol,
    interval,
    apikey: apiKey,
    outputsize: 'compact',
  });
  
  return `${baseUrl}?${params.toString()}`;
}

// Sample AlphaVantage response for testing
export const sampleAlphaVantageResponse: AlphaVantageResponse = {
  'Meta Data': {
    '1. Information': 'Intraday (5min) open, high, low, close prices and volume',
    '2. Symbol': 'AAPL',
    '3. Last Refreshed': '2024-01-10 20:00:00',
    '4. Interval': '5min',
    '5. Output Size': 'Compact',
    '6. Time Zone': 'US/Eastern',
  },
  'Time Series (5min)': {
    '2024-01-10 20:00:00': {
      '1. open': '185.00',
      '2. high': '186.50',
      '3. low': '184.20',
      '4. close': '185.80',
      '5. volume': '125000',
    },
    '2024-01-10 19:55:00': {
      '1. open': '184.50',
      '2. high': '185.20',
      '3. low': '183.80',
      '4. close': '185.00',
      '5. volume': '98000',
    },
    // ... more data points
  },
};
