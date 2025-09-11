import { CandleData } from './alphavantage';

export interface GenericAdapterConfig {
  timeField?: string;
  openField?: string;
  highField?: string;
  lowField?: string;
  closeField?: string;
  volumeField?: string;
  dataPath?: string; // Path to the data array in the response
}

export function parseGenericResponse(
  response: any,
  config: GenericAdapterConfig = {}
): CandleData[] {
  const {
    timeField = 'time',
    openField = 'open',
    highField = 'high',
    lowField = 'low',
    closeField = 'close',
    volumeField = 'volume',
    dataPath = '',
  } = config;

  // Navigate to the data array if path is specified
  let data = response;
  if (dataPath) {
    const pathParts = dataPath.split('.');
    for (const part of pathParts) {
      data = data?.[part];
    }
  }

  // If data is not an array, try to find the first array in the response
  if (!Array.isArray(data)) {
    // Look for common array field names
    const arrayFields = ['data', 'results', 'quotes', 'candles', 'ohlc', 'timeseries'];
    for (const field of arrayFields) {
      if (Array.isArray(response[field])) {
        data = response[field];
        break;
      }
    }
  }

  if (!Array.isArray(data)) {
    console.warn('Could not find array data in response');
    return [];
  }

  return data.map((item: any) => ({
    time: item[timeField] || item.date || item.timestamp,
    open: parseFloat(item[openField]) || 0,
    high: parseFloat(item[highField]) || 0,
    low: parseFloat(item[lowField]) || 0,
    close: parseFloat(item[closeField]) || 0,
    volume: item[volumeField] ? parseFloat(item[volumeField]) : undefined,
  })).filter(item => item.time); // Filter out items without time
}

// Auto-detect field mappings from sample data
export function detectFieldMappings(sampleData: any): GenericAdapterConfig {
  if (!Array.isArray(sampleData) || sampleData.length === 0) {
    return {};
  }

  const firstItem = sampleData[0];
  const fields = Object.keys(firstItem);
  
  const mapping: GenericAdapterConfig = {};

  // Common field name patterns
  const timePatterns = ['time', 'date', 'timestamp', 't', 'datetime'];
  const openPatterns = ['open', 'o', 'opening_price'];
  const highPatterns = ['high', 'h', 'highest_price', 'max'];
  const lowPatterns = ['low', 'l', 'lowest_price', 'min'];
  const closePatterns = ['close', 'c', 'closing_price', 'price'];
  const volumePatterns = ['volume', 'vol', 'v', 'trading_volume'];

  const findField = (patterns: string[]) => {
    return fields.find(field => 
      patterns.some(pattern => 
        field.toLowerCase().includes(pattern.toLowerCase())
      )
    );
  };

  mapping.timeField = findField(timePatterns);
  mapping.openField = findField(openPatterns);
  mapping.highField = findField(highPatterns);
  mapping.lowField = findField(lowPatterns);
  mapping.closeField = findField(closePatterns);
  mapping.volumeField = findField(volumePatterns);

  return mapping;
}

// Sample demo data for testing
export const demoData: CandleData[] = [
  { time: '2024-01-01', open: 100, high: 105, low: 98, close: 103, volume: 1000 },
  { time: '2024-01-02', open: 103, high: 108, low: 101, close: 107, volume: 1200 },
  { time: '2024-01-03', open: 107, high: 109, low: 104, close: 105, volume: 900 },
  { time: '2024-01-04', open: 105, high: 112, low: 103, close: 110, volume: 1500 },
  { time: '2024-01-05', open: 110, high: 115, low: 108, close: 114, volume: 1300 },
  { time: '2024-01-08', open: 114, high: 118, low: 112, close: 116, volume: 1100 },
  { time: '2024-01-09', open: 116, high: 120, low: 115, close: 119, volume: 1400 },
  { time: '2024-01-10', open: 119, high: 122, low: 117, close: 121, volume: 1000 },
];
