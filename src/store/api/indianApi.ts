import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  IndianAPIStockResponse,
  IndianAPIHistoryResponse,
  IndianAPIListResponse,
  parseIndianStockResponse,
  parseIndianHistoryResponse,
  extractIndianStockMetadata,
  StockQuote,
  CandleData,
  StockMetadata,
} from '@/lib/adapters/indianApiAdapter';

// Cache tags for selective invalidation
export const indianApiTags = {
  StockList: 'StockList',
  StockPrice: 'StockPrice', 
  StockHistory: 'StockHistory',
} as const;

export const indianApi = createApi({
  reducerPath: 'indianApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api/indianapi',
    timeout: 15000, // 15 second timeout for slow networks
  }),
  tagTypes: Object.values(indianApiTags),
  
  endpoints: (builder) => ({
    
    // Get list of popular Indian stocks
    getStockList: builder.query<IndianAPIListResponse, void>({
      query: () => 'list',
      providesTags: ['StockList'],
      keepUnusedDataFor: 300, // Cache for 5 minutes
    }),

    // Get current stock price and details
    getStockPrice: builder.query<StockQuote, { symbol: string }>({
      query: ({ symbol }) => ({
        url: 'stocks',
        params: { symbol },
      }),
      transformResponse: (response: IndianAPIStockResponse, meta, { symbol }) => 
        parseIndianStockResponse(response, symbol),
      providesTags: (result, error, { symbol }) => [
        { type: 'StockPrice' as const, id: symbol },
      ],
      keepUnusedDataFor: 60, // Cache for 1 minute
    }),

    // Get multiple stock prices (for table view)
    getMultipleStockPrices: builder.query<StockQuote[], { symbols: string[] }>({
      queryFn: async ({ symbols }, _queryApi, _extraOptions, fetchWithBQ) => {
        try {
          // Fetch all symbols in parallel with rate limiting consideration
          const promises = symbols.map(async (symbol, index) => {
            // Stagger requests to avoid overwhelming the API
            if (index > 0) {
              await new Promise(resolve => setTimeout(resolve, 100 * index));
            }
            
            const response = await fetchWithBQ({
              url: 'stocks',
              params: { symbol },
            });
            
            if (response.error) {
              console.warn(`Failed to fetch ${symbol}:`, response.error);
              return null;
            }
            
            return parseIndianStockResponse(response.data as IndianAPIStockResponse, symbol);
          });

          const results = await Promise.all(promises);
          const validResults = results.filter((result): result is StockQuote => 
            result !== null
          );

          return { data: validResults };
        } catch (error) {
          return { 
            error: { 
              status: 'FETCH_ERROR', 
              error: error instanceof Error ? error.message : 'Unknown error' 
            } 
          };
        }
      },
      providesTags: (result, error, { symbols }) => [
        ...symbols.map(symbol => ({ 
          type: 'StockPrice' as const, 
          id: symbol 
        })),
      ],
      keepUnusedDataFor: 60, // Cache for 1 minute
    }),

    // Get historical stock data (daily, weekly, monthly)
    getStockHistory: builder.query<{
      candleData: CandleData[];
      metadata: StockMetadata | null;
    }, { 
      symbol: string; 
      period: '1d' | '1w' | '1m' | '3m' | '6m' | '1y' 
    }>({
      query: ({ symbol, period }) => ({
        url: 'history',
        params: { symbol, period },
      }),
      transformResponse: (response: IndianAPIHistoryResponse) => ({
        candleData: parseIndianHistoryResponse(response),
        metadata: extractIndianStockMetadata(response),
      }),
      providesTags: (result, error, { symbol, period }) => [
        { type: 'StockHistory' as const, id: `${symbol}-${period}` },
      ],
      keepUnusedDataFor: 1800, // Cache for 30 minutes
    }),

    // Get daily historical data (convenience endpoint)
    getDailyHistory: builder.query<{
      candleData: CandleData[];
      metadata: StockMetadata | null;
    }, { symbol: string }>({
      query: ({ symbol }) => ({
        url: 'history',
        params: { symbol, period: '1d' },
      }),
      transformResponse: (response: IndianAPIHistoryResponse) => ({
        candleData: parseIndianHistoryResponse(response),
        metadata: extractIndianStockMetadata(response),
      }),
      providesTags: (result, error, { symbol }) => [
        { type: 'StockHistory' as const, id: `${symbol}-daily` },
      ],
      keepUnusedDataFor: 300, // Cache for 5 minutes
    }),

    // Get weekly historical data
    getWeeklyHistory: builder.query<{
      candleData: CandleData[];
      metadata: StockMetadata | null;
    }, { symbol: string }>({
      query: ({ symbol }) => ({
        url: 'history',
        params: { symbol, period: '1w' },
      }),
      transformResponse: (response: IndianAPIHistoryResponse) => ({
        candleData: parseIndianHistoryResponse(response),
        metadata: extractIndianStockMetadata(response),
      }),
      providesTags: (result, error, { symbol }) => [
        { type: 'StockHistory' as const, id: `${symbol}-weekly` },
      ],
      keepUnusedDataFor: 900, // Cache for 15 minutes
    }),

    // Get monthly historical data
    getMonthlyHistory: builder.query<{
      candleData: CandleData[];
      metadata: StockMetadata | null;
    }, { symbol: string }>({
      query: ({ symbol }) => ({
        url: 'history',
        params: { symbol, period: '1m' },
      }),
      transformResponse: (response: IndianAPIHistoryResponse) => ({
        candleData: parseIndianHistoryResponse(response),
        metadata: extractIndianStockMetadata(response),
      }),
      providesTags: (result, error, { symbol }) => [
        { type: 'StockHistory' as const, id: `${symbol}-monthly` },
      ],
      keepUnusedDataFor: 3600, // Cache for 1 hour
    }),

  }),
});

// Export hooks for use in components
export const {
  useGetStockListQuery,
  useGetStockPriceQuery,
  useGetMultipleStockPricesQuery,
  useGetStockHistoryQuery,
  useGetDailyHistoryQuery,
  useGetWeeklyHistoryQuery,
  useGetMonthlyHistoryQuery,
  useLazyGetStockPriceQuery,
  useLazyGetStockHistoryQuery,
} = indianApi;

// Export useful selectors
export const selectStockPrice = (symbol: string) => 
  indianApi.endpoints.getStockPrice.select({ symbol });

export const selectStockHistory = (symbol: string, period: '1d' | '1w' | '1m' | '3m' | '6m' | '1y') =>
  indianApi.endpoints.getStockHistory.select({ symbol, period });

// Utility function to invalidate all cache for a symbol
export const invalidateStockData = (symbol: string) => ({
  type: 'invalidateCache',
  payload: {
    tags: [
      { type: indianApiTags.StockPrice, id: symbol },
      { type: indianApiTags.StockHistory, id: `${symbol}-daily` },
      { type: indianApiTags.StockHistory, id: `${symbol}-weekly` },
      { type: indianApiTags.StockHistory, id: `${symbol}-monthly` },
    ],
  },
});
