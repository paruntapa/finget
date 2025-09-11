'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Bitcoin,
  ExternalLink
} from 'lucide-react';
import { Widget } from '@/store/slices/widgetsSlice';
import { useGetSparkLinesQuery } from '@/store/api/coinbaseApi';
import { POPULAR_CRYPTO_PAIRS, formatCryptoPrice, generateMockCryptoData } from '@/lib/adapters/coinbaseAdapter';

interface CryptoTableProps {
  widget: Widget;
}

export function CryptoTable({ widget }: CryptoTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;

  // Get crypto pairs from widget config or use defaults
  const cryptoPairs = useMemo(() => {
    const configuredPairs = widget.config.cryptoPairs;
    if (configuredPairs && typeof configuredPairs === 'string') {
      return configuredPairs.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    }
    return POPULAR_CRYPTO_PAIRS.map(pair => pair.symbol);
  }, [widget.config.cryptoPairs]);

  // Fetch real crypto data from Coinbase API
  const { 
    data: cryptoQuotes = [], 
    error, 
    isLoading, 
    refetch 
  } = useGetSparkLinesQuery(
    undefined,
    { 
      pollingInterval: widget.config.refreshInterval * 1000,
    }
  );

  // Filter to only show configured crypto pairs and add fallback data
  const displayQuotes = useMemo(() => {
    // Filter real data for configured pairs
    const realData = cryptoQuotes.filter(quote => 
      cryptoPairs.includes(quote.symbol)
    );

    // Add mock data for missing pairs
    const realSymbols = realData.map(q => q.symbol);
    const missingPairs = cryptoPairs.filter(pair => !realSymbols.includes(pair));
    
    const mockData = missingPairs.map(symbol => {
      const mockCandles = generateMockCryptoData(symbol, 2);
      const latest = mockCandles[mockCandles.length - 1];
      const previous = mockCandles[mockCandles.length - 2];
      
      const change = latest.close - previous.close;
      const changePercent = (change / previous.close) * 100;
      
      return {
        symbol,
        price: latest.close,
        change,
        changePercent,
        volume: latest.volume || 0,
        lastUpdated: new Date().toISOString(),
      };
    });

    return [...realData, ...mockData];
  }, [cryptoQuotes, cryptoPairs]);

  // Filter quotes based on search term
  const filteredQuotes = useMemo(() => {
    if (!searchTerm.trim()) return displayQuotes;
    
    const term = searchTerm.toLowerCase();
    return displayQuotes.filter(quote => {
      const pair = POPULAR_CRYPTO_PAIRS.find(p => p.symbol === quote.symbol);
      return (
        quote.symbol.toLowerCase().includes(term) ||
        pair?.name.toLowerCase().includes(term) ||
        pair?.category.toLowerCase().includes(term)
      );
    });
  }, [displayQuotes, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const paginatedQuotes = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredQuotes.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredQuotes, currentPage, itemsPerPage]);

  const handleRefresh = () => {
    refetch();
  };

  const handleRowClick = (symbol: string) => {
    router.push(`/crypto/${symbol}`);
  };

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const icon = isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
    
    return (
      <div className={`flex items-center space-x-1 ${color}`}>
        {icon}
        <span className="text-xs font-medium">
          {change > 0 ? '+' : ''}{change.toFixed(2)}
        </span>
        <span className="text-xs">
          ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%)
        </span>
      </div>
    );
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getCryptoName = (symbol: string) => {
    const pair = POPULAR_CRYPTO_PAIRS.find(p => p.symbol === symbol);
    return pair?.name || symbol.split('-')[0];
  };

  const getCryptoCategory = (symbol: string) => {
    const pair = POPULAR_CRYPTO_PAIRS.find(p => p.symbol === symbol);
    return pair?.category || 'Crypto';
  };

  return (
    <div className="space-y-3">
      {/* Crypto Market Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bitcoin className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs">
            💰 Crypto
          </Badge>
          <Badge variant="outline" className="text-xs">
            {cryptoPairs.length} pairs
          </Badge>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading}
          className="h-8 px-2"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cryptocurrencies..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
          className="pl-8 h-8 text-xs"
        />
      </div>

      {/* Data Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="text-xs border-b">
              <TableHead className="h-8 px-2">Symbol</TableHead>
              <TableHead className="h-8 px-2">Name</TableHead>
              <TableHead className="h-8 px-2 text-right">Price</TableHead>
              <TableHead className="h-8 px-2 text-right">Change</TableHead>
              <TableHead className="h-8 px-2 text-right">Category</TableHead>
              <TableHead className="h-8 px-2 text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground text-xs">
                  <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />
                  Loading crypto data...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-destructive text-xs">
                  Failed to load crypto data. Please try refreshing.
                </TableCell>
              </TableRow>
            ) : paginatedQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-muted-foreground text-xs">
                  {searchTerm ? 'No cryptocurrencies match your search' : 'No crypto data available'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedQuotes.map((quote) => (
                <TableRow
                  key={quote.symbol}
                  className="cursor-pointer hover:bg-muted/50 text-xs transition-colors"
                  onClick={() => handleRowClick(quote.symbol)}
                >
                  <TableCell className="py-2 px-2 font-medium">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {quote.symbol.split('-')[0].slice(0, 2)}
                        </span>
                      </div>
                      <span>{quote.symbol}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-2">
                    {getCryptoName(quote.symbol)}
                  </TableCell>
                  <TableCell className="py-2 px-2 text-right font-mono">
                    {formatCryptoPrice(quote.price)}
                  </TableCell>
                  <TableCell className="py-2 px-2 text-right">
                    {formatChange(quote.change, quote.changePercent)}
                  </TableCell>
                  <TableCell className="py-2 px-2 text-right">
                    <Badge variant="outline" className="text-xs">
                      {getCryptoCategory(quote.symbol)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-2 text-right text-muted-foreground">
                    {formatTime(quote.lastUpdated)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredQuotes.length)} of {filteredQuotes.length}
          </span>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="px-2 py-1 text-xs">
              {currentPage} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Data from Coinbase Pro</span>
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open('https://pro.coinbase.com/', '_blank')}
            className="h-6 px-2 text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View on Coinbase
          </Button>
        </div>
      </div>
    </div>
  );
}
