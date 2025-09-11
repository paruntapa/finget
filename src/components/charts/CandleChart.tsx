'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, CandlestickSeries } from 'lightweight-charts';
import { CandleData } from '@/lib/adapters/alphavantage';

// Theme-based colors
const getChartTheme = () => {
  // Check if we're in dark mode by looking for the 'dark' class on html
  const isDark = typeof window !== 'undefined' && 
    document.documentElement.classList.contains('dark');
  
  return {
    textColor: isDark ? '#f3f4f6' : '#374151',
    gridColor: isDark ? '#374151' : '#e5e7eb',
    borderColor: isDark ? '#4b5563' : '#d1d5db',
    upColor: '#10b981',
    downColor: '#ef4444',
  };
};

interface CandleChartProps {
  data: CandleData[];
  height?: number;
  className?: string;
}

export function CandleChart({ data, height = 400, className = '' }: CandleChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const theme = getChartTheme();
    
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: theme.textColor,
      },
      grid: {
        vertLines: { color: theme.gridColor },
        horzLines: { color: theme.gridColor },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: theme.borderColor,
      },
      timeScale: {
        borderColor: theme.borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    chartRef.current = chart;

    // Add candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: theme.upColor,
      downColor: theme.downColor,
      borderUpColor: theme.upColor,
      borderDownColor: theme.downColor,
      wickUpColor: theme.upColor,
      wickDownColor: theme.downColor,
    });

    seriesRef.current = candlestickSeries;

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, [height]);

  // Update chart data when data changes
  useEffect(() => {
    if (!seriesRef.current || !data.length) return;

    try {
      // Format data for lightweight-charts
      const formattedData = data.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));

      // Set data and fit content
      seriesRef.current.setData(formattedData);
      
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent();
      }
    } catch (error) {
      console.error('Chart rendering error:', error);
    }
  }, [data]);

  return (
    <div 
      ref={chartContainerRef} 
      className={`w-full ${className}`}
      style={{ height: `${height}px` }}
    />
  );
}
