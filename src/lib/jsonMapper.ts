// Utility functions for exploring and mapping JSON data

export interface JsonPath {
  path: string;
  value: any;
  type: string;
  isArray: boolean;
}

export function extractField(data: any, path: string): any {
  if (!path || path === '') return data;
  
  const pathParts = path.split('.');
  let current = data;
  
  for (const part of pathParts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    
    // Handle array indices like "data[0]"
    const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      current = current[arrayName];
      if (Array.isArray(current)) {
        current = current[parseInt(index, 10)];
      }
    } else {
      current = current[part];
    }
  }
  
  return current;
}

export function exploreJSON(data: any, maxDepth: number = 3, currentPath: string = ''): JsonPath[] {
  const paths: JsonPath[] = [];
  
  if (maxDepth <= 0) return paths;
  
  const explore = (obj: any, path: string, depth: number) => {
    if (depth > maxDepth || obj === null || obj === undefined) return;
    
    if (typeof obj === 'object') {
      if (Array.isArray(obj)) {
        paths.push({
          path,
          value: `Array(${obj.length})`,
          type: 'array',
          isArray: true,
        });
        
        // Explore first few items of array
        obj.slice(0, 3).forEach((item, index) => {
          const arrayPath = `${path}[${index}]`;
          explore(item, arrayPath, depth + 1);
        });
      } else {
        // Regular object
        if (path) {
          paths.push({
            path,
            value: 'Object',
            type: 'object',
            isArray: false,
          });
        }
        
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = path ? `${path}.${key}` : key;
          
          if (typeof value === 'object' && value !== null) {
            explore(value, newPath, depth + 1);
          } else {
            paths.push({
              path: newPath,
              value: value,
              type: typeof value,
              isArray: false,
            });
          }
        });
      }
    } else {
      paths.push({
        path,
        value: obj,
        type: typeof obj,
        isArray: false,
      });
    }
  };
  
  explore(data, currentPath, 0);
  return paths;
}

export function getValuePreview(value: any, maxLength: number = 50): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  
  let preview = String(value);
  if (preview.length > maxLength) {
    preview = preview.substring(0, maxLength) + '...';
  }
  
  return preview;
}

export function isNumericPath(data: any, path: string): boolean {
  const value = extractField(data, path);
  return typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value));
}

export function isDatePath(data: any, path: string): boolean {
  const value = extractField(data, path);
  if (!value) return false;
  
  // Check if it's a valid date string or timestamp
  const date = new Date(value);
  return !isNaN(date.getTime());
}

// Suggest field mappings based on common patterns
export function suggestMappings(paths: JsonPath[]): Record<string, string[]> {
  const suggestions: Record<string, string[]> = {
    time: [],
    open: [],
    high: [],
    low: [],
    close: [],
    volume: [],
    price: [],
  };
  
  paths.forEach(({ path, type }) => {
    if (type !== 'number' && type !== 'string') return;
    
    const lowerPath = path.toLowerCase();
    
    // Time/date fields
    if (lowerPath.includes('time') || lowerPath.includes('date') || lowerPath.includes('timestamp')) {
      suggestions.time.push(path);
    }
    
    // OHLC fields
    if (lowerPath.includes('open')) suggestions.open.push(path);
    if (lowerPath.includes('high')) suggestions.high.push(path);
    if (lowerPath.includes('low')) suggestions.low.push(path);
    if (lowerPath.includes('close') || lowerPath === 'c') suggestions.close.push(path);
    if (lowerPath.includes('volume') || lowerPath === 'vol') suggestions.volume.push(path);
    if (lowerPath.includes('price') && !lowerPath.includes('open') && !lowerPath.includes('close')) {
      suggestions.price.push(path);
    }
  });
  
  return suggestions;
}

// Detect if JSON data represents time-series stock data
export function detectTimeSeriesStockData(data: any): {
  isStockData: boolean;
  dataType: 'candlestick' | 'table' | 'unknown';
  detectedFields?: {
    timeField?: string;
    openField?: string;
    highField?: string;
    lowField?: string;
    closeField?: string;
    volumeField?: string;
  };
} {
  if (!data || typeof data !== 'object') {
    return { isStockData: false, dataType: 'unknown' };
  }

  // Check for AlphaVantage-style time series
  const timeSeriesKeys = Object.keys(data).filter(key => 
    key.toLowerCase().includes('time series') || 
    key.toLowerCase().includes('time_series')
  );

  if (timeSeriesKeys.length > 0) {
    const timeSeriesData = data[timeSeriesKeys[0]];
    if (timeSeriesData && typeof timeSeriesData === 'object') {
      const firstEntry = Object.values(timeSeriesData)[0] as any;
      if (firstEntry && typeof firstEntry === 'object') {
        const keys = Object.keys(firstEntry).map(k => k.toLowerCase());
        
        const hasOHLC = keys.some(k => k.includes('open')) &&
                       keys.some(k => k.includes('high')) &&
                       keys.some(k => k.includes('low')) &&
                       keys.some(k => k.includes('close'));
        
        if (hasOHLC) {
          return {
            isStockData: true,
            dataType: 'candlestick',
            detectedFields: {
              openField: keys.find(k => k.includes('open')),
              highField: keys.find(k => k.includes('high')),
              lowField: keys.find(k => k.includes('low')),
              closeField: keys.find(k => k.includes('close')),
              volumeField: keys.find(k => k.includes('volume')),
            }
          };
        }
      }
    }
  }

  // Check for array-based time series data
  if (Array.isArray(data)) {
    if (data.length > 0) {
      const firstItem = data[0];
      if (firstItem && typeof firstItem === 'object') {
        const keys = Object.keys(firstItem).map(k => k.toLowerCase());
        
        const hasTime = keys.some(k => 
          k.includes('time') || k.includes('date') || k.includes('timestamp')
        );
        
        const hasOHLC = keys.some(k => k.includes('open')) &&
                       keys.some(k => k.includes('high')) &&
                       keys.some(k => k.includes('low')) &&
                       keys.some(k => k.includes('close'));
        
        if (hasTime && hasOHLC) {
          return {
            isStockData: true,
            dataType: 'candlestick',
            detectedFields: {
              timeField: keys.find(k => k.includes('time') || k.includes('date') || k.includes('timestamp')),
              openField: keys.find(k => k.includes('open')),
              highField: keys.find(k => k.includes('high')),
              lowField: keys.find(k => k.includes('low')),
              closeField: keys.find(k => k.includes('close')),
              volumeField: keys.find(k => k.includes('volume')),
            }
          };
        }
      }
    }
  }

  // Check if it's tabular data that could be displayed as a table
  if (Array.isArray(data) || (typeof data === 'object' && Object.keys(data).length > 0)) {
    return { isStockData: false, dataType: 'table' };
  }

  return { isStockData: false, dataType: 'unknown' };
}

// Convert generic data to table format
export function convertToTableData(data: any): { columns: string[]; rows: any[] } {
  if (Array.isArray(data)) {
    if (data.length === 0) return { columns: [], rows: [] };
    
    const firstItem = data[0];
    if (typeof firstItem === 'object' && firstItem !== null) {
      return {
        columns: Object.keys(firstItem),
        rows: data
      };
    }
    
    // Handle array of primitives
    return {
      columns: ['Value'],
      rows: data.map((value, index) => ({ Value: value, Index: index }))
    };
  }
  
  if (typeof data === 'object' && data !== null) {
    // Special handling for Coinbase exchange rates API
    if (data.data && data.data.currency && data.data.rates) {
      const currency = data.data.currency;
      const rates = data.data.rates;
      
      return {
        columns: ['Currency', `Rate (per 1 ${currency})`, 'Type'],
        rows: Object.entries(rates).map(([currencyCode, rate]) => ({
          Currency: currencyCode,
          [`Rate (per 1 ${currency})`]: typeof rate === 'string' ? parseFloat(rate).toFixed(6) : rate,
          Type: getCurrencyType(currencyCode)
        }))
      };
    }
    
    // Special handling for nested data structures (look for common patterns)
    if (data.data && typeof data.data === 'object') {
      return convertToTableData(data.data);
    }
    
    // Handle objects with rates/prices/values structure
    if (data.rates && typeof data.rates === 'object') {
      return {
        columns: ['Currency', 'Rate'],
        rows: Object.entries(data.rates).map(([key, value]) => ({
          Currency: key,
          Rate: typeof value === 'string' ? parseFloat(value).toFixed(6) : value
        }))
      };
    }
    
    // Convert object to key-value pairs (fallback)
    return {
      columns: ['Key', 'Value'],
      rows: Object.entries(data).map(([key, value]) => ({
        Key: key,
        Value: typeof value === 'object' ? JSON.stringify(value) : value
      }))
    };
  }
  
  return { columns: [], rows: [] };
}

// Helper function to categorize currency types
function getCurrencyType(currencyCode: string): string {
  const fiatCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'KRW', 'SGD', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON', 'BGN', 'HRK', 'RSD', 'TRY', 'ZAR', 'BRL', 'MXN', 'ARS', 'CLP', 'COP', 'PEN', 'UYU', 'BOB', 'VES'];
  const stablecoins = ['USDT', 'USDC', 'BUSD', 'DAI', 'USDS', 'USD1'];
  const majorcryptos = ['BTC', 'ETH', 'BNB', 'ADA', 'DOT', 'LINK', 'LTC', 'XRP', 'BCH', 'ATOM'];
  
  if (fiatCurrencies.includes(currencyCode)) {
    return 'Fiat';
  } else if (stablecoins.includes(currencyCode)) {
    return 'Stablecoin';
  } else if (majorcryptos.includes(currencyCode)) {
    return 'Major Crypto';
  } else if (currencyCode.length <= 4 && /^[A-Z]{3,4}$/.test(currencyCode)) {
    return 'Fiat/Other';
  } else {
    return 'Crypto';
  }
}
