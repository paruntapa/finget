'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { importDashboard, clearDashboard } from '@/store/slices/widgetsSlice';

interface DashboardSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DashboardSettings({ open, onOpenChange }: DashboardSettingsProps) {
  const dispatch = useAppDispatch();
  const widgets = useAppSelector((state) => state.widgets.widgets);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      widgets,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinGet-dashboard-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        if (importData.widgets && Array.isArray(importData.widgets)) {
          dispatch(importDashboard(importData.widgets));
          onOpenChange(false);
        } else {
          alert('Invalid dashboard file format');
        }
      } catch (error) {
        alert('Failed to parse dashboard file');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  };

  const handleClearDashboard = () => {
    if (widgets.length === 0) return;
    
    if (confirm('Are you sure you want to clear all widgets? This action cannot be undone.')) {
      dispatch(clearDashboard());
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dashboard Settings</DialogTitle>
            <DialogDescription>
              Manage your dashboard configuration and preferences.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="data">Import/Export</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dashboard Info</CardTitle>
                  <CardDescription>
                    Current dashboard statistics and information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Widgets:</span>
                    <span className="text-sm font-medium">{widgets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Widget Types:</span>
                    <span className="text-sm font-medium">
                      {[...new Set(widgets.map(w => w.type))].join(', ') || 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Data Sources:</span>
                    <span className="text-sm font-medium">
                      {[...new Set(widgets.map(w => w.config.apiSource))].join(', ') || 'None'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <span>Danger Zone</span>
                  </CardTitle>
                  <CardDescription>
                    Irreversible actions that affect your entire dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="destructive"
                    onClick={handleClearDashboard}
                    disabled={widgets.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Widgets
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="data" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Export Dashboard</CardTitle>
                  <CardDescription>
                    Download your current dashboard configuration as a JSON file.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleExport}
                    disabled={widgets.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Dashboard
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Import Dashboard</CardTitle>
                  <CardDescription>
                    Load a dashboard configuration from a JSON file. This will replace your current dashboard.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button onClick={handleImport}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import Dashboard
                  </Button>
                  
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Supported format:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>JSON files exported from FinGet</li>
                      <li>Files must contain valid widget configurations</li>
                      <li>Import will overwrite existing widgets</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">API Configuration</CardTitle>
                  <CardDescription>
                    Set up your API keys for data sources. Keys are stored locally.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2">To use external data sources, add these environment variables:</p>
                    <div className="bg-muted p-3 rounded-md font-mono text-xs">
                      <div>ALPHA_VANTAGE_KEY=your_api_key</div>
                      <div>FINNHUB_KEY=your_api_key</div>
                    </div>
                    <p className="mt-2">
                      Restart the development server after adding environment variables.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
