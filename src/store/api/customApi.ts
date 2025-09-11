import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { convertToTableData } from '@/lib/jsonMapper';

export interface CustomApiResponse {
  data: any;
  tableData: {
    columns: string[];
    rows: any[];
  };
}

export const customApi = createApi({
  reducerPath: 'customApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
  }),
  tagTypes: ['CustomData'],
  endpoints: (builder) => ({
    // Fetch data from custom URL
    getCustomData: builder.query<CustomApiResponse, { url: string }>({
      queryFn: async (arg, _queryApi, _extraOptions, fetchWithBQ) => {
        const { url } = arg;
        
        try {
          const response = await fetchWithBQ({
            url: `/proxy?url=${encodeURIComponent(url)}`,
          });

          if (response.error) {
            return { error: response.error };
          }

          const data = response.data;
          
          // Convert to table format
          const tableData = convertToTableData(data);

          // TODO: Detect stock-like custom API data and auto-upgrade to candlestick
          // Check if data has OHLC structure and suggest chart upgrade
          
          return {
            data: {
              data,
              tableData,
            } as CustomApiResponse
          };
        } catch (error) {
          return { 
            error: { 
              status: 'CUSTOM_ERROR', 
              data: { 
                error: 'Failed to fetch custom data',
                details: String(error)
              }
            }
          };
        }
      },
      providesTags: (result, error, { url }) => [
        { type: 'CustomData', id: url },
      ],
      keepUnusedDataFor: 300, // 5 minutes cache
    }),
  }),
});

export const {
  useGetCustomDataQuery,
  useLazyGetCustomDataQuery,
} = customApi;