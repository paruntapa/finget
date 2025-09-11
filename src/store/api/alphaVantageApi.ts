import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { AlphaVantageResponse } from '@/lib/adapters/alphavantage';

export const alphaVantageApi = createApi({
  reducerPath: 'alphaVantageApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
  }),
  tagTypes: ['StockData'],
  endpoints: (builder) => ({
    // Get intraday data for stock table
    getIntraday: builder.query<AlphaVantageResponse, { symbol: string; interval?: string }>({
      query: ({ symbol, interval = '5min' }) => ({
        url: `/alphavantage?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${interval}`,
      }),
      providesTags: (result, error, { symbol }) => [
        { type: 'StockData', id: `${symbol}-intraday` },
      ],
      keepUnusedDataFor: 60, // 1 minute cache for intraday
    }),

    // Get daily data for charts (using free endpoint)
    getDaily: builder.query<AlphaVantageResponse, { symbol: string }>({
      query: ({ symbol }) => ({
        url: `/alphavantage?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full`,
      }),
      providesTags: (result, error, { symbol }) => [
        { type: 'StockData', id: `${symbol}-daily` },
      ],
      keepUnusedDataFor: 300, // 5 minutes cache for daily
    }),

    // Get weekly data for charts (using free endpoint)
    getWeekly: builder.query<AlphaVantageResponse, { symbol: string }>({
      query: ({ symbol }) => ({
        url: `/alphavantage?function=TIME_SERIES_WEEKLY&symbol=${symbol}`,
      }),
      providesTags: (result, error, { symbol }) => [
        { type: 'StockData', id: `${symbol}-weekly` },
      ],
      keepUnusedDataFor: 900, // 15 minutes cache for weekly
    }),

    // Get monthly data for charts (using free endpoint)
    getMonthly: builder.query<AlphaVantageResponse, { symbol: string }>({
      query: ({ symbol }) => ({
        url: `/alphavantage?function=TIME_SERIES_MONTHLY&symbol=${symbol}`,
      }),
      providesTags: (result, error, { symbol }) => [
        { type: 'StockData', id: `${symbol}-monthly` },
      ],
      keepUnusedDataFor: 1800, // 30 minutes cache for monthly
    }),
  }),
});

export const {
  useGetIntradayQuery,
  useGetDailyQuery,
  useGetWeeklyQuery,
  useGetMonthlyQuery,
  useLazyGetIntradayQuery,
  useLazyGetDailyQuery,
  useLazyGetWeeklyQuery,
  useLazyGetMonthlyQuery,
} = alphaVantageApi;