'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Settings, 
  X, 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  Bitcoin 
} from 'lucide-react';
import { Widget } from '@/store/slices/widgetsSlice';
import { useAppDispatch } from '@/store';
import { removeWidget, selectWidget } from '@/store/slices/widgetsSlice';
import { WidgetConfigurator } from './WidgetConfigurator';
import { StockTable } from '@/components/widgets/StockTable/StockTable';
import { CryptoTable } from '@/components/widgets/CryptoTable/CryptoTable';
import { CustomTable } from '@/components/widgets/CustomTable/CustomTable';

interface WidgetContainerProps {
  widget: Widget;
  onClick?: () => void;
}

export function WidgetContainer({ widget, onClick }: WidgetContainerProps) {
  const dispatch = useAppDispatch();
  const [showConfig, setShowConfig] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(removeWidget(widget.id));
  };

  const handleConfigure = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfig(true);
    dispatch(selectWidget(widget.id));
  };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const renderWidget = () => {
    switch (widget.type) {
      case 'stock-table':
        return <StockTable widget={widget} />;
      case 'crypto-table':
        return <CryptoTable widget={widget} />;
      case 'custom-table':
        return <CustomTable widget={widget} />;
      default:
        return (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <AlertCircle className="h-8 w-8 mr-2" />
            Unknown widget type
          </div>
        );
    }
  };

  const getWidgetIcon = () => {
    switch (widget.type) {
      case 'stock-table':
        return <TrendingUp className="h-4 w-4" />;
      case 'crypto-table':
        return <Bitcoin className="h-4 w-4" />;
      case 'custom-table':
        return <div className="h-4 w-4 border border-current" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
        className="h-full"
        onClick={onClick}
      >
        <Card className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 py-2">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <div className="drag-handle cursor-move opacity-50 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="flex items-center space-x-2 min-w-0">
                {getWidgetIcon()}
                <h3 className="font-semibold text-sm truncate">
                  {widget.title}
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs">
                {widget.config.apiSource}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleConfigure}
              >
                <Settings className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                onClick={handleRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-3 pt-0 overflow-hidden">
            {renderWidget()}
          </CardContent>
        </Card>
      </motion.div>

      <WidgetConfigurator
        widget={widget}
        open={showConfig}
        onOpenChange={setShowConfig}
      />
    </>
  );
}
