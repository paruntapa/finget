'use client';

import React, { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
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
  AlertCircle, 
  Search, 
  RefreshCw,
  Link,
  ExternalLink
} from 'lucide-react';
import { Widget } from '@/store/slices/widgetsSlice';
import { useGetCustomDataQuery } from '@/store/api/customApi';

interface CustomTableProps {
  widget: Widget;
}

export function CustomTable({ widget }: CustomTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const { 
    data: apiResponse, 
    error, 
    isLoading,
    refetch
  } = useGetCustomDataQuery(
    { url: widget.config.apiUrl! },
    {
      skip: !widget.config.apiUrl,
      pollingInterval: widget.config.refreshInterval * 1000,
    }
  );

  // Process table data from API response
  const tableData = useMemo(() => {
    if (!apiResponse?.tableData) return { columns: [], rows: [] };
    return apiResponse.tableData;
  }, [apiResponse]);

  // TODO: Detect stock-like custom API data and auto-upgrade to candlestick
  // Check if data has OHLC structure and suggest chart upgrade
  const isStockLike = useMemo(() => {
    if (!tableData.columns.length) return false;
    
    const cols = tableData.columns.map(c => c.toLowerCase());
    const hasOHLC = cols.some(c => c.includes('open')) &&
                   cols.some(c => c.includes('high')) &&
                   cols.some(c => c.includes('low')) &&
                   cols.some(c => c.includes('close'));
    
    return hasOHLC;
  }, [tableData.columns]);

  // Filter rows based on search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return tableData.rows;
    
    const term = searchTerm.toLowerCase();
    return tableData.rows.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(term)
      )
    );
  }, [tableData.rows, searchTerm]);

  // No pagination needed with scrolling - show all filtered data

  const handleRefresh = async () => {
    await refetch();
  };

  const formatCellValue = (value: unknown, columnName: string) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    
    // Special formatting for exchange rate data
    if (columnName.toLowerCase().includes('rate') && typeof value === 'string' && !isNaN(parseFloat(value))) {
      const numValue = parseFloat(value);
      
      // If it's a very small number (like BTC rates), show more precision
      if (numValue < 0.01) {
        return numValue.toExponential(4);
      }
      // If it's a large number (like some altcoin rates), use scientific notation
      if (numValue > 1000000) {
        return numValue.toExponential(2);
      }
      // Normal rates, show reasonable precision
      return numValue.toFixed(6);
    }
    
    if (typeof value === 'number') {
      // Format as currency if it looks like a price
      if (value > 0 && value < 10000 && value.toString().includes('.')) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        }).format(value);
      }
      // Format large numbers with commas
      return new Intl.NumberFormat('en-US').format(value);
    }
    
    // Currency type formatting
    if (columnName.toLowerCase() === 'type') {
      const typeColors = {
        'Fiat': 'text-blue-400',
        'Stablecoin': 'text-green-400', 
        'Major Crypto': 'text-red-400',
        'Crypto': 'text-orange-400',
        'Fiat/Other': 'text-gray-400',
      };
      
      const colorClass = typeColors[value as keyof typeof typeColors] || 'bg-gray-100 text-gray-800';
      
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colorClass}`}>
          {String(value)}
        </span>
      );
    }
    
    // Truncate long strings
    const str = String(value);
    if (str.length > 50) {
      return str.substring(0, 47) + '...';
    }
    
    return str;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex space-x-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-6 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <p className="text-sm font-medium text-destructive mb-1">Failed to load data</p>
        <p className="text-xs text-muted-foreground mb-3">
          {error && 'data' in error ? (error.data as { error?: string })?.error || 'Network error' : 'Unknown error'}
        </p>
        <Button size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!widget.config.apiUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium mb-1">No API URL configured</p>
        <p className="text-xs text-muted-foreground">
          Configure a custom API URL in widget settings
        </p>
      </div>
    );
  }

  if (tableData.columns.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium mb-1">No data structure found</p>
        <p className="text-xs text-muted-foreground">
          The API response could not be converted to table format
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Link className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate max-w-[120px]">
            {widget.config.apiUrl}
          </span>
          {isStockLike && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              OHLC
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(widget.config.apiUrl, '_blank')}
            className="h-6 w-6 p-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Compact Search */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-7 h-7 text-xs"
        />
      </div>

      {/* Compact Data Table with Scrolling */}
      <div className="relative">
        <div className="border rounded-md h-60 overflow-auto bg-background/50 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <Table>
            <TableHeader className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b">
              <TableRow className="text-xs border-b">
                {tableData.columns.map((column) => (
                  <TableHead key={column} className="h-5 px-2 text-xs font-semibold whitespace-nowrap">
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={tableData.columns.length} className="text-center py-6 text-muted-foreground text-xs">
                    {searchTerm ? 'No data matches your search' : 'No data available'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row, index) => (
                  <TableRow key={index} className="text-xs hover:bg-muted/20 transition-colors">
                    {tableData.columns.map((column) => (
                      <TableCell key={column} className="py-0.5 px-2 text-xs whitespace-nowrap" title={String(row[column])}>
                        {formatCellValue(row[column], column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Scroll indicator */}
        {filteredRows.length > 10 && (
          <div className="absolute bottom-1 right-1 bg-background/80 backdrop-blur-sm rounded px-1 py-0.5 text-xs text-muted-foreground border">
            ↕ Scroll
          </div>
        )}
      </div>

      {/* Data Summary */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {filteredRows.length} {filteredRows.length === 1 ? 'row' : 'rows'} 
          {searchTerm && ` (filtered from ${tableData.rows.length})`}
        </span>
        <span>
          Scroll to view all data
        </span>
      </div>
    </div>
  );
}
