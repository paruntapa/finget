'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Eye, EyeOff, Copy, AlertCircle } from 'lucide-react';
import { Widget, WidgetConfig } from '@/store/slices/widgetsSlice';
import { useAppDispatch } from '@/store';
import { updateWidget, updateWidgetConfig } from '@/store/slices/widgetsSlice';
import { useLazyGetCustomDataQuery } from '@/store/api/customApi';
import { JsonExplorer } from './JsonExplorer';

interface WidgetConfiguratorProps {
  widget: Widget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WidgetConfigurator({ widget, open, onOpenChange }: WidgetConfiguratorProps) {
  const dispatch = useAppDispatch();
  const [localConfig, setLocalConfig] = useState<WidgetConfig>(widget.config);
  const [localTitle, setLocalTitle] = useState(widget.title);
  const [customUrl, setCustomUrl] = useState('');
  const [showRawData, setShowRawData] = useState(false);
  
  const [fetchData, { data: apiData, error: apiError, isLoading }] = useLazyGetCustomDataQuery();

  const handleSave = () => {
    dispatch(updateWidget({
      id: widget.id,
      updates: { title: localTitle, config: localConfig }
    }));
    onOpenChange(false);
  };

  const handleConfigChange = (updates: Partial<WidgetConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  };

  const handleTestUrl = async () => {
    if (customUrl) {
      try {
        await fetchData({ url: customUrl });
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    }
  };

  const handleFieldMapping = (field: string, path: string) => {
    handleConfigChange({
      mapping: {
        ...localConfig.mapping,
        [field]: path
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configure Widget</SheetTitle>
          <SheetDescription>
            Customize your widget settings and data mapping.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="general" className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="data">Data Source</TabsTrigger>
            <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div>
              <Label htmlFor="widget-title">Widget Title</Label>
              <Input
                id="widget-title"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="Enter widget title"
              />
            </div>

            <div>
              <Label htmlFor="refresh-interval">Refresh Interval (seconds)</Label>
              <Input
                id="refresh-interval"
                type="number"
                min="10"
                value={localConfig.refreshInterval}
                onChange={(e) => handleConfigChange({ refreshInterval: parseInt(e.target.value) || 60 })}
              />
            </div>

            {widget.type === 'candle' && (
              <div>
                <Label htmlFor="chart-type">Chart Type</Label>
                <Select 
                  value={localConfig.chartType} 
                  onValueChange={(value) => handleConfigChange({ chartType: value as 'candlestick' | 'line' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="candlestick">Candlestick</SelectItem>
                    <SelectItem value="line">Line Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div>
              <Label htmlFor="api-source">Data Source</Label>
              <Select 
                value={localConfig.apiSource} 
                onValueChange={(value) => handleConfigChange({ apiSource: value as WidgetConfig['apiSource'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom API</SelectItem>
                  <SelectItem value="alphavantage">AlphaVantage</SelectItem>
                  <SelectItem value="finnhub">Finnhub</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {localConfig.apiSource === 'custom' ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="custom-url">API URL</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="custom-url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://api.example.com/data"
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleTestUrl}
                      disabled={!customUrl || isLoading}
                    >
                      {isLoading ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a public API URL to test data fetching and field mapping.
                  </p>
                </div>

                {customUrl && (
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleConfigChange({ apiUrl: customUrl })}
                      disabled={localConfig.apiUrl === customUrl}
                    >
                      Use This URL
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="symbol">Symbol</Label>
                  <Input
                    id="symbol"
                    value={localConfig.symbol || ''}
                    onChange={(e) => handleConfigChange({ symbol: e.target.value.toUpperCase() })}
                    placeholder="e.g., AAPL, TSLA"
                  />
                </div>
                <div>
                  <Label htmlFor="interval">Interval</Label>
                  <Select 
                    value={localConfig.interval} 
                    onValueChange={(value) => handleConfigChange({ interval: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1min">1 Minute</SelectItem>
                      <SelectItem value="5min">5 Minutes</SelectItem>
                      <SelectItem value="15min">15 Minutes</SelectItem>
                      <SelectItem value="30min">30 Minutes</SelectItem>
                      <SelectItem value="60min">1 Hour</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {apiError && (
              <div className="flex items-start space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">API Error</p>
                  <p className="text-xs text-destructive/80">
                    {apiError && 'data' in apiError ? (apiError.data as any)?.error || 'Unknown error' : 'Network error'}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Field Mapping</h4>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRawData(!showRawData)}
                  >
                    {showRawData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showRawData ? 'Hide' : 'Show'} Raw Data
                  </Button>
                </div>
              </div>

              {apiData && (
                <JsonExplorer
                  data={apiData}
                  onFieldSelect={handleFieldMapping}
                  currentMapping={localConfig.mapping}
                  widgetType={widget.type}
                />
              )}

              {showRawData && apiData && (
                <Collapsible>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      Raw API Response
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2 z-10"
                        onClick={() => navigator.clipboard.writeText(JSON.stringify(apiData, null, 2))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-96">
                        {JSON.stringify(apiData, null, 2)}
                      </pre>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}

              <div className="space-y-2">
                <h5 className="text-sm font-medium">Current Mappings</h5>
                {Object.entries(localConfig.mapping).length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No field mappings configured. Test an API URL to set up mappings.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {Object.entries(localConfig.mapping).map(([field, path]) => (
                      <div key={field} className="flex items-center space-x-2">
                        <Badge variant="outline">{field}</Badge>
                        <span className="text-xs">→</span>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">{path}</code>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
