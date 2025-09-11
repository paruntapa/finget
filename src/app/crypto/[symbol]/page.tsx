'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  ExternalLink,
  RefreshCw,
  Bitcoin
} from 'lucide-react';
import { 
  useGet1MinCandlesQuery, 
  useGet5MinCandlesQuery, 
  useGet15MinCandlesQuery,
  useGet1HourCandlesQuery,
  useGet1DayCandlesQuery,
  useGetSparkLinesQuery
} from '@/store/api/coinbaseApi';
import { generateMockCryptoData, formatCryptoPrice, POPULAR_CRYPTO_PAIRS } from '@/lib/adapters/coinbaseAdapter';
import { CandleChart } from '@/components/charts/CandleChart';

type TimeFrame = '1m' | '5m' | '15m' | '1h' | '1d';

export default function CryptoPage() {
  const router = useRouter();
  const params = useParams();
  const symbol = params?.symbol as string;
  
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('1h');

  // Fetch current crypto price for info display
  const { data: sparkLinesData } = useGetSparkLinesQuery(
    undefined, 
    { pollingInterval: 10000 }
  );

  // Get current crypto data
  const currentCryptoData = sparkLinesData?.find(quote => quote.symbol === symbol);

  // Fetch historical data based on timeframe
  const { data: data1m, error: error1m, isLoading: loading1m, refetch: refetch1m } = useGet1MinCandlesQuery(
    { symbol },
    { skip: selectedTimeFrame !== '1m', pollingInterval: 10000 }
  );
  const { data: data5m, error: error5m, isLoading: loading5m, refetch: refetch5m } = useGet5MinCandlesQuery(
    { symbol },
    { skip: selectedTimeFrame !== '5m', pollingInterval: 10000 }
  );
  const { data: data15m, error: error15m, isLoading: loading15m, refetch: refetch15m } = useGet15MinCandlesQuery(
    { symbol },
    { skip: selectedTimeFrame !== '15m', pollingInterval: 10000 }
  );
  const { data: data1h, error: error1h, isLoading: loading1h, refetch: refetch1h } = useGet1HourCandlesQuery(
    { symbol },
    { skip: selectedTimeFrame !== '1h', pollingInterval: 10000 }
  );
  const { data: data1d, error: error1d, isLoading: loading1d, refetch: refetch1d } = useGet1DayCandlesQuery(
    { symbol },
    { skip: selectedTimeFrame !== '1d', pollingInterval: 10000 }
  );

  // Determine current data and loading state
  const currentData = selectedTimeFrame === '1m' ? data1m : 
                     selectedTimeFrame === '5m' ? data5m :
                     selectedTimeFrame === '15m' ? data15m :
                     selectedTimeFrame === '1h' ? data1h : data1d;
  const currentError = selectedTimeFrame === '1m' ? error1m : 
                      selectedTimeFrame === '5m' ? error5m :
                      selectedTimeFrame === '15m' ? error15m :
                      selectedTimeFrame === '1h' ? error1h : error1d;
  const isLoading = selectedTimeFrame === '1m' ? loading1m : 
                   selectedTimeFrame === '5m' ? loading5m :
                   selectedTimeFrame === '15m' ? loading15m :
                   selectedTimeFrame === '1h' ? loading1h : loading1d;

  // Parse chart data from Coinbase response
  const chartData = React.useMemo(() => {
    if (!currentData?.candleData) {
      console.log('No candle data found in:', currentData);
      return [];
    }
    
    try {
      console.log('Raw candle data:', currentData.candleData.slice(0, 3));
      return currentData.candleData;
    } catch (error) {
      console.error('Error parsing chart data:', error);
      return [];
    }
  }, [currentData]);

  // Mock data for when API is not available
  const mockChartData = React.useMemo(() => {
    if (chartData.length > 0) return chartData;
    
    // Generate mock data using Coinbase adapter
    return generateMockCryptoData(symbol || 'BTC-USD', 30);
  }, [chartData, symbol]);

  // Use real crypto data if available, otherwise use mock chart data
  const displayData = mockChartData;
  const currentPrice = currentCryptoData?.price || displayData[displayData.length - 1]?.close || 0;
  const change = currentCryptoData?.change || 0;
  const changePercent = currentCryptoData?.changePercent || 0;
  const volume = currentCryptoData?.volume || displayData[displayData.length - 1]?.volume || 0;
  const lastUpdated = currentCryptoData?.lastUpdated || new Date().toISOString();
  const isPositive = change >= 0;

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    } else {
      return volume.toFixed(0);
    }
  };

  const formatTimeFrame = (timeframe: TimeFrame) => {
    const labels = {
      '1m': '1 Minute',
      '5m': '5 Minutes', 
      '15m': '15 Minutes',
      '1h': '1 Hour',
      '1d': '1 Day',
    };
    return labels[timeframe] || timeframe;
  };

  const handleRefreshManual = () => {
    if (selectedTimeFrame === '1m') refetch1m();
    else if (selectedTimeFrame === '5m') refetch5m();
    else if (selectedTimeFrame === '15m') refetch15m();
    else if (selectedTimeFrame === '1h') refetch1h();
    else refetch1d();
  };

  const getCryptoInfo = (symbol: string) => {
    const pair = POPULAR_CRYPTO_PAIRS.find(p => p.symbol === symbol);
    return {
      name: pair?.name || symbol.split('-')[0],
      category: pair?.category || 'Crypto',
      baseCurrency: symbol.split('-')[0] || 'BTC',
      quoteCurrency: symbol.split('-')[1] || 'USD',
    };
  };

  const cryptoInfo = getCryptoInfo(symbol || 'BTC-USD');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Bitcoin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{cryptoInfo.name}</h1>
                <p className="text-sm text-muted-foreground">{symbol} • {cryptoInfo.category}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshManual}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://pro.coinbase.com/trade/${symbol}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Coinbase Pro
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
                  {formatCryptoPrice(currentPrice)}
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
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Price Chart</CardTitle>
                <CardDescription>
                  {formatTimeFrame(selectedTimeFrame)} candlestick chart for {symbol}
                </CardDescription>
              </div>
              
              <Tabs value={selectedTimeFrame} onValueChange={(value) => setSelectedTimeFrame(value as TimeFrame)}>
                <TabsList>
                  <TabsTrigger value="1m">1m</TabsTrigger>
                  <TabsTrigger value="5m">5m</TabsTrigger>
                  <TabsTrigger value="15m">15m</TabsTrigger>
                  <TabsTrigger value="1h">1h</TabsTrigger>
                  <TabsTrigger value="1d">1d</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Loading chart data...</p>
                </div>
              </div>
            ) : currentError ? (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-sm font-medium text-destructive mb-1">Failed to load chart data</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {currentError && 'data' in currentError ? (currentError.data as { error?: string })?.error : 'Network error'}
                  </p>
                  <Button size="sm" onClick={handleRefreshManual}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <CandleChart 
                  data={displayData}
                  height={400}
                />
                {chartData.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Showing demo data • Real-time data from Coinbase Pro
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Trading Summary */}
        {displayData.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Trading Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-xl font-semibold">{formatCryptoPrice(displayData[displayData.length - 1]?.open || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">High</p>
                  <p className="text-xl font-semibold">{formatCryptoPrice(displayData[displayData.length - 1]?.high || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Low</p>
                  <p className="text-xl font-semibold">{formatCryptoPrice(displayData[displayData.length - 1]?.low || 0)}</p>
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
