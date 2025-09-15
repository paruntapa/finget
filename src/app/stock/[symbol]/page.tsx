'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { 
  useGetDailyHistoryQuery, 
  useGetWeeklyHistoryQuery, 
  useGetMonthlyHistoryQuery,
  useGetStockPriceQuery
} from '@/store/api/indianApi';
import { generateMockIndianCandleData } from '@/lib/adapters/indianApiAdapter';
import { CandleChart } from '@/components/charts/CandleChart';

type TimeFrame = 'daily' | 'weekly' | 'monthly';

export default function StockPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = params?.symbol as string;
  
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('daily');
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const { data: stockData } = useGetStockPriceQuery(
    { symbol: symbol || '' }, 
    { skip: !symbol, pollingInterval: 10000 }
  );

  const { 
    data: dailyData, 
    error: dailyError, 
    isLoading: dailyLoading,
    refetch: refetchDaily
  } = useGetDailyHistoryQuery(
    { symbol },
    { skip: selectedTimeFrame !== 'daily', pollingInterval: 10000 }
  );

  const { 
    data: weeklyData, 
    error: weeklyError, 
    isLoading: weeklyLoading,
    refetch: refetchWeekly
  } = useGetWeeklyHistoryQuery(
    { symbol },
    { skip: selectedTimeFrame !== 'weekly', pollingInterval: 10000 }
  );

  const { 
    data: monthlyData, 
    error: monthlyError, 
    isLoading: monthlyLoading,
    refetch: refetchMonthly
  } = useGetMonthlyHistoryQuery(
    { symbol },
    { skip: selectedTimeFrame !== 'monthly', pollingInterval: 10000 }
  );

  const currentData = selectedTimeFrame === 'daily' ? dailyData : 
                     selectedTimeFrame === 'weekly' ? weeklyData : monthlyData;
  const currentError = selectedTimeFrame === 'daily' ? dailyError : 
                      selectedTimeFrame === 'weekly' ? weeklyError : monthlyError;
  const isLoading = selectedTimeFrame === 'daily' ? dailyLoading : 
                   selectedTimeFrame === 'weekly' ? weeklyLoading : monthlyLoading;

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedTimeFrame === 'daily') refetchDaily();
      else if (selectedTimeFrame === 'weekly') refetchWeekly();
      else refetchMonthly();
    }, 10000); 

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedTimeFrame, refetchDaily, refetchWeekly, refetchMonthly]);

  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [refreshInterval]);

  const chartData = React.useMemo(() => {
    if (!currentData?.candleData) return [];
    
    try {
      return currentData.candleData;
    } catch (error) {
      console.error('Error parsing chart data:', error);
      return [];
    }
  }, [currentData]);

  // Mock data for when API is not available
  const mockChartData = React.useMemo(() => {
    if (chartData.length > 0) return chartData;
    
    // Generate mock data using IndianAPI adapter
    return generateMockIndianCandleData(symbol || 'RELIANCE', 30);
  }, [chartData, symbol]);

  // Use real stock data if available, otherwise use mock chart data
  const displayData = mockChartData;
  const currentPrice = stockData?.price || displayData[displayData.length - 1]?.close || 0;
  const change = stockData?.change || 0;
  const changePercent = stockData?.changePercent || 0;
  const volume = stockData?.volume || displayData[displayData.length - 1]?.volume || 0;
  const lastUpdated = stockData?.lastUpdated || new Date().toISOString();
  const isPositive = change >= 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const handleRefreshManual = () => {
    if (selectedTimeFrame === 'daily') refetchDaily();
    else if (selectedTimeFrame === 'weekly') refetchWeekly();
    else refetchMonthly();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="flex items-center space-x-2">
              <h1 className="text-3xl font-bold">{symbol}</h1>
              <Badge variant="outline">Live Chart</Badge>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshManual}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://finance.yahoo.com/quote/${symbol}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Yahoo Finance
            </Button>
          </div>
        </div>

        {/* Price Summary */}
        {displayData.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Current Price</CardTitle>
              <CardDescription>Last updated: {new Date(lastUpdated).toLocaleTimeString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="text-3xl font-bold">
                  {formatPrice(currentPrice)}
                </div>
                <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                  <span className="text-lg font-medium">
                    {change > 0 ? '+' : ''}{change.toFixed(2)}
                  </span>
                  <span className="text-sm">
                    ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chart Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Price Chart</CardTitle>
                <CardDescription>Refreshes every 10 seconds</CardDescription>
              </div>
              
              <Tabs value={selectedTimeFrame} onValueChange={(value) => setSelectedTimeFrame(value as TimeFrame)}>
                <TabsList>
                  <TabsTrigger value="daily">Daily</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="w-full h-[400px]" />
            ) : currentError ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center p-4">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <p className="text-lg font-medium text-destructive mb-2">Failed to load chart data</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {currentError && 'data' in currentError ? (currentError.data as { error?: string })?.error : 'Network error'}
                </p>
                <Button onClick={handleRefreshManual}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : (
              <>
                {chartData.length === 0 && (
                  <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    ⚠️ Using mock data for demo - API limit reached
                  </div>
                )}
                <CandleChart data={displayData} height={400} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Stock metrics */}
        {displayData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Trading Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-xl font-semibold">{formatPrice(displayData[displayData.length - 1]?.open || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">High</p>
                  <p className="text-xl font-semibold">{formatPrice(displayData[displayData.length - 1]?.high || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Low</p>
                  <p className="text-xl font-semibold">{formatPrice(displayData[displayData.length - 1]?.low || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Volume</p>
                  <p className="text-xl font-semibold">{formatVolume(volume)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
