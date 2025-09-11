'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Removed unused Select imports
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Bitcoin, Database } from 'lucide-react';
import { useAppDispatch } from '@/store';
import { addWidget, Widget, WidgetConfig } from '@/store/slices/widgetsSlice';

interface AddWidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const widgetTypes = [
  {
    type: 'stock-table' as const,
    name: 'Stock Table',
    description: 'Real-time Indian stock quotes from NSE/BSE',
    icon: TrendingUp,
    defaultSize: { w: 8, h: 6 },
  },
  {
    type: 'crypto-table' as const,
    name: 'Crypto Table',
    description: 'Real-time cryptocurrency prices from Coinbase',
    icon: Bitcoin,
    defaultSize: { w: 8, h: 6 },
  },
  {
    type: 'custom-table' as const,
    name: 'Custom API Table',
    description: 'Display data from any custom API endpoint',
    icon: Database,
    defaultSize: { w: 6, h: 4 },
  },
];

export function AddWidgetModal({ open, onOpenChange }: AddWidgetModalProps) {
  const dispatch = useAppDispatch();
  const [selectedType, setSelectedType] = useState<Widget['type'] | null>(null);
  const [title, setTitle] = useState('');
  const [customUrl, setCustomUrl] = useState('');

  const handleCreate = () => {
    if (!selectedType || !title) return;

    const widgetType = widgetTypes.find(type => type.type === selectedType);
    if (!widgetType) return;

    // Find available position for new widget
    const x = 0;
    const y = 0;

    // Set up default configuration based on widget type
    const defaultConfig: WidgetConfig = {
      apiSource: selectedType === 'stock-table' ? 'indianapi' : 
                 selectedType === 'crypto-table' ? 'coinbase' : 'custom',
      refreshInterval: 60,
      mapping: {},
    };

    if (selectedType === 'stock-table') {
      defaultConfig.symbols = 'RELIANCE,TCS,HDFCBANK,INFY,ICICIBANK';
      defaultConfig.region = 'India';
    } else if (selectedType === 'crypto-table') {
      defaultConfig.cryptoPairs = 'BTC-USD,ETH-USD,SOL-USD,ADA-USD,DOT-USD';
    } else if (selectedType === 'custom-table') {
      defaultConfig.apiUrl = customUrl || '';
    }

    const newWidget: Omit<Widget, 'id'> = {
      type: selectedType,
      title,
      config: defaultConfig,
      x,
      y,
      w: widgetType.defaultSize.w,
      h: widgetType.defaultSize.h,
    };

    dispatch(addWidget(newWidget));
    
    // Reset form
    setSelectedType(null);
    setTitle('');
    setCustomUrl('');
    
    onOpenChange(false);
  };

  const generateTitle = () => {
    if (selectedType) {
      return selectedType === 'stock-table' ? 'Stock Watchlist' : 'Custom Data';
    }
    return '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Widget</DialogTitle>
          <DialogDescription>
            Choose a widget type and configure its basic settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Widget Type Selection */}
          <div>
            <Label className="text-base font-medium">Widget Type</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
              {widgetTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.type}
                    className={`cursor-pointer transition-colors ${
                      selectedType === type.type
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedType(type.type)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center space-x-2 text-sm">
                        <Icon className="h-4 w-4" />
                        <span>{type.name}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-xs">
                        {type.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {selectedType && (
            <div className="space-y-4">
              {/* Basic Configuration */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Widget Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter widget title"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-auto p-0 text-xs"
                    onClick={() => setTitle(generateTitle())}
                  >
                    Auto-generate title
                  </Button>
                </div>

                {/* Custom API URL for custom table */}
                {selectedType === 'custom-table' && (
                  <div>
                    <Label htmlFor="custom-url">API URL</Label>
                    <Input
                      id="custom-url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://api.example.com/data"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter any public API URL. Data will be displayed as a table.
                    </p>
                  </div>
                )}

                {/* Stock table info */}
                {selectedType === 'stock-table' && (
                  <div className="p-3 bg-muted/50 rounded-md">
                    <p className="text-sm font-medium mb-1">Stock Table Features:</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Region selector (USA/India)</li>
                      <li>• Pre-configured stock symbols</li>
                      <li>• Click rows for detailed charts</li>
                      <li>• Real-time price updates</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!selectedType || !title}
          >
            Create Widget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
