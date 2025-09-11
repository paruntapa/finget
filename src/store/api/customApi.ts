import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { convertToTableData } from '@/lib/jsonMapper';

export interface CustomApiResponse {
  data: unknown;
  tableData: {
    columns: string[];
    rows: Record<string, unknown>[];
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
      query: ({ url }) => ({
        url: `/proxy?url=${encodeURIComponent(url)}`,
      }),
      transformResponse: (response: unknown): CustomApiResponse => {
        // Convert to table format
        const tableData = convertToTableData(response);

        return { 
          data: response,
          tableData
        };
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