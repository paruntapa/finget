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
  Globe,
  ExternalLink
} from 'lucide-react';
import { Widget } from '@/store/slices/widgetsSlice';
import { useGetMultipleStockPricesQuery } from '@/store/api/indianApi';

interface StockTableProps {
  widget: Widget;
}

// Popular Indian stocks (compatible with IndianAPI)
const INDIAN_STOCKS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 
  'HDFC', 'SBIN', 'BHARTIARTL', 'ITC', 'WIPRO',
  'LT', 'HCLTECH', 'ASIANPAINT', 'MARUTI', 'BAJFINANCE'
];

export function StockTable({ widget }: StockTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 10;
  const stockSymbols = useMemo(() => {
    const configuredStocks = widget.config.symbols;
    if (configuredStocks && typeof configuredStocks === 'string') {
      return configuredStocks.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
    }
    return INDIAN_STOCKS;
  }, [widget.config.symbols]);

  // Fetch real stock data from IndianAPI
  const { 
    data: stockQuotes = [], 
    error, 
    isLoading, 
    refetch 
  } = useGetMultipleStockPricesQuery(
    { symbols: stockSymbols },
    { 
      pollingInterval: widget.config.refreshInterval * 1000,
      skip: stockSymbols.length === 0 
    }
  );

  // Debug logging to see what data we're getting
  console.log('StockTable - stockQuotes data:', stockQuotes);
  console.log('StockTable - error:', error);
  console.log('StockTable - isLoading:', isLoading);

  // Filter stocks based on search term
  const filteredStocks = useMemo(() => {
    if (!searchTerm.trim()) return stockQuotes;
    
    const term = searchTerm.toLowerCase();
    return stockQuotes.filter(stock => 
      stock.symbol.toLowerCase().includes(term)
    );
  }, [stockQuotes, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);
  const paginatedStocks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredStocks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredStocks, currentPage, itemsPerPage]);

  const handleRefresh = () => {
    refetch();
  };

  const handleRowClick = (symbol: string) => {
    router.push(`/stock/${symbol}`);
  };

  // No region change needed - IndianAPI only supports Indian stocks

  const formatPrice = (price: number) => {
    // Debug logging to see what price values we're getting
    console.log('formatPrice called with:', price, typeof price);
    
    // Ensure price is a valid number
    if (price === undefined || price === null || isNaN(price)) {
      console.warn('Invalid price value:', price);
      return '₹0.00';
    }
    
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number, changePercent: number) => {
    const isPositive = change >= 0;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const icon = isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />;
    
    return (
      <div className={`flex items-center space-x-1 ${color}`}>
        {icon}
        <span className="font-medium">
          {change > 0 ? '+' : ''}{change.toFixed(2)}
        </span>
        <span className="text-xs">
          ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%)
        </span>
      </div>
    );
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-3">
      {/* Indian Stock Market Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs">
            🇮🇳 India
          </Badge>
          <Badge variant="outline" className="text-xs">
            {stockSymbols.length} stocks
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
          placeholder="Search stocks..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="pl-8 h-8 text-xs"
        />
      </div>

      {/* Stock Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="h-8 px-2">Symbol</TableHead>
              <TableHead className="h-8 px-2 text-right">Price</TableHead>
              <TableHead className="h-8 px-2 text-right">Change</TableHead>
              <TableHead className="h-8 px-2 text-right">Volume</TableHead>
              <TableHead className="h-8 px-2 text-right">Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-xs">
                  <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />
                  Loading stock data...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-destructive text-xs">
                  Failed to load stock data. Please try refreshing.
                </TableCell>
              </TableRow>
            ) : paginatedStocks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-muted-foreground text-xs">
                  {searchTerm ? 'No stocks match your search' : 'No stock data available'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedStocks.map((stock) => (
                <TableRow
                  key={stock.symbol}
                  className="cursor-pointer hover:bg-muted/50 text-xs transition-colors"
                  onClick={() => handleRowClick(stock.symbol)}
                >
                  <TableCell className="py-2 px-2">
                    <div className="flex items-center space-x-1">
                      <Badge variant="outline" className="text-xs font-mono">
                        {stock.symbol}
                      </Badge>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-2 text-right font-medium">
                    {formatPrice(stock.price)}
                  </TableCell>
                  <TableCell className="py-2 px-2 text-right">
                    {formatChange(stock.change, stock.changePercent)}
                  </TableCell>
                  <TableCell className="py-2 px-2 text-right text-muted-foreground">
                    {formatVolume(stock.volume)}
                  </TableCell>
                  <TableCell className="py-2 px-2 text-right text-muted-foreground">
                    {formatTime(stock.lastUpdated)}
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
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStocks.length)} of {filteredStocks.length}
          </span>
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-6 w-6 p-0"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="px-2">
              {currentPage} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-6 w-6 p-0"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
