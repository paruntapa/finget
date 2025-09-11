import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  CoinbaseSparkLineResponse,
  CoinbaseCandleResponse,
  parseCoinbaseSparkLines,
  parseCoinbaseCandles,
  extractCryptoMetadata,
  CryptoQuote,
  CandleData,
  CryptoMetadata,
  GranularityKey,
  COINBASE_GRANULARITIES,
} from '@/lib/adapters/coinbaseAdapter';

// Cache tags for selective invalidation
export const coinbaseApiTags = {
  SparkLines: 'SparkLines',
  Candles: 'Candles',
} as const;

export const coinbaseApi = createApi({
  reducerPath: 'coinbaseApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/coinbase',
    timeout: 20000, // 20 second timeout for crypto data
  }),
  tagTypes: Object.values(coinbaseApiTags),
  
  endpoints: (builder) => ({
    
    // Get spark lines for multiple crypto pairs
    getSparkLines: builder.query<CryptoQuote[], void>({
      query: () => 'spark-lines',
      transformResponse: (response: CoinbaseSparkLineResponse) => 
        parseCoinbaseSparkLines(response),
      providesTags: ['SparkLines'],
      keepUnusedDataFor: 30, // Cache for 30 seconds (crypto moves fast)
    }),

    // Get candlestick data for a specific crypto pair
    getCandles: builder.query<{
      candleData: CandleData[];
      metadata: CryptoMetadata;
    }, { 
      symbol: string; 
      granularity: GranularityKey;
      start?: string;
      end?: string;
    }>({
      query: ({ symbol, granularity, start, end }) => {
        const params: Record<string, string> = {
          symbol,
          granularity: COINBASE_GRANULARITIES[granularity].seconds.toString(),
        };
        
        if (start) params.start = start;
        if (end) params.end = end;
        
        return {
          url: 'candles',
          params,
        };
      },
      transformResponse: (response: CoinbaseCandleResponse, meta, { symbol }) => ({
        candleData: parseCoinbaseCandles(response),
        metadata: extractCryptoMetadata(symbol),
      }),
      providesTags: (result, error, { symbol, granularity }) => [
        { type: 'Candles' as const, id: `${symbol}-${granularity}` },
      ],
      keepUnusedDataFor: 180, // Cache for 3 minutes
    }),

    // Get 1 minute candles (convenience endpoint)
    get1MinCandles: builder.query<{
      candleData: CandleData[];
      metadata: CryptoMetadata;
    }, { symbol: string }>({
      query: ({ symbol }) => ({
        url: 'candles',
        params: { 
          symbol, 
          granularity: COINBASE_GRANULARITIES['1m'].seconds.toString() 
        },
      }),
      transformResponse: (response: CoinbaseCandleResponse, meta, { symbol }) => ({
        candleData: parseCoinbaseCandles(response),
        metadata: extractCryptoMetadata(symbol),
      }),
      providesTags: (result, error, { symbol }) => [
        { type: 'Candles' as const, id: `${symbol}-1m` },
      ],
      keepUnusedDataFor: 30, // Cache for 30 seconds
    }),

    // Get 5 minute candles
    get5MinCandles: builder.query<{
      candleData: CandleData[];
      metadata: CryptoMetadata;
    }, { symbol: string }>({
      query: ({ symbol }) => ({
        url: 'candles',
        params: { 
          symbol, 
          granularity: COINBASE_GRANULARITIES['5m'].seconds.toString() 
        },
      }),
      transformResponse: (response: CoinbaseCandleResponse, meta, { symbol }) => ({
        candleData: parseCoinbaseCandles(response),
        metadata: extractCryptoMetadata(symbol),
      }),
      providesTags: (result, error, { symbol }) => [
        { type: 'Candles' as const, id: `${symbol}-5m` },
      ],
      keepUnusedDataFor: 60, // Cache for 1 minute
    }),

    // Get 15 minute candles
    get15MinCandles: builder.query<{
      candleData: CandleData[];
      metadata: CryptoMetadata;
    }, { symbol: string }>({
      query: ({ symbol }) => ({
        url: 'candles',
        params: { 
          symbol, 
          granularity: COINBASE_GRANULARITIES['15m'].seconds.toString() 
        },
      }),
      transformResponse: (response: CoinbaseCandleResponse, meta, { symbol }) => ({
        candleData: parseCoinbaseCandles(response),
        metadata: extractCryptoMetadata(symbol),
      }),
      providesTags: (result, error, { symbol }) => [
        { type: 'Candles' as const, id: `${symbol}-15m` },
      ],
      keepUnusedDataFor: 180, // Cache for 3 minutes
    }),

    // Get 1 hour candles
    get1HourCandles: builder.query<{
      candleData: CandleData[];
      metadata: CryptoMetadata;
    }, { symbol: string }>({
      query: ({ symbol }) => ({
        url: 'candles',
        params: { 
          symbol, 
          granularity: COINBASE_GRANULARITIES['1h'].seconds.toString() 
        },
      }),
      transformResponse: (response: CoinbaseCandleResponse, meta, { symbol }) => ({
        candleData: parseCoinbaseCandles(response),
        metadata: extractCryptoMetadata(symbol),
      }),
      providesTags: (result, error, { symbol }) => [
        { type: 'Candles' as const, id: `${symbol}-1h` },
      ],
      keepUnusedDataFor: 600, // Cache for 10 minutes
    }),

    // Get 1 day candles
    get1DayCandles: builder.query<{
      candleData: CandleData[];
      metadata: CryptoMetadata;
    }, { symbol: string }>({
      query: ({ symbol }) => ({
        url: 'candles',
        params: { 
          symbol, 
          granularity: COINBASE_GRANULARITIES['1d'].seconds.toString() 
        },
      }),
      transformResponse: (response: CoinbaseCandleResponse, meta, { symbol }) => ({
        candleData: parseCoinbaseCandles(response),
        metadata: extractCryptoMetadata(symbol),
      }),
      providesTags: (result, error, { symbol }) => [
        { type: 'Candles' as const, id: `${symbol}-1d` },
      ],
      keepUnusedDataFor: 3600, // Cache for 1 hour
    }),

  }),
});

// Export hooks for use in components
export const {
  useGetSparkLinesQuery,
  useGetCandlesQuery,
  useGet1MinCandlesQuery,
  useGet5MinCandlesQuery,
  useGet15MinCandlesQuery,
  useGet1HourCandlesQuery,
  useGet1DayCandlesQuery,
  useLazyGetCandlesQuery,
} = coinbaseApi;

// Export useful selectors
export const selectSparkLines = coinbaseApi.endpoints.getSparkLines.select();

export const selectCandles = (symbol: string, granularity: GranularityKey) =>
  coinbaseApi.endpoints.getCandles.select({ symbol, granularity });

// Utility function to invalidate all cache for a symbol
export const invalidateCryptoData = (symbol: string) => ({
  type: 'invalidateCache',
  payload: {
    tags: [
      { type: 'Candles', id: `${symbol}-1m` },
      { type: 'Candles', id: `${symbol}-5m` },
      { type: 'Candles', id: `${symbol}-15m` },
      { type: 'Candles', id: `${symbol}-1h` },
      { type: 'Candles', id: `${symbol}-1d` },
    ],
  },
});
