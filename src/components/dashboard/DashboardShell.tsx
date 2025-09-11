'use client';

import React, { useState } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { useAppSelector, useAppDispatch } from '@/store';
import { updateLayout, selectWidget } from '@/store/slices/widgetsSlice';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Plus, Settings } from 'lucide-react';
import { WidgetContainer } from './WidgetContainer';
import { AddWidgetModal } from './AddWidgetModal';
import { DashboardSettings } from './DashboardSettings';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export function DashboardShell() {
  const dispatch = useAppDispatch();
  const widgets = useAppSelector((state) => state.widgets.widgets);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const layout: Layout[] = widgets.map((widget) => ({
    i: widget.id,
    x: widget.x,
    y: widget.y,
    w: widget.w,
    h: widget.h,
    minW: 2,
    minH: 2,
  }));

  const handleLayoutChange = (newLayout: Layout[]) => {
    dispatch(updateLayout(newLayout));
  };

  const handleWidgetClick = (widgetId: string) => {
    dispatch(selectWidget(widgetId));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold tracking-tight">FinGet</h1>
            <span className="text-sm text-muted-foreground">
              Customizable Finance Dashboard
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddWidget(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Widget
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Dashboard */}
      <main className="p-4">
        {widgets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center">
            <Card className="p-8 max-w-md">
              <div className="mb-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Welcome to FinGet</h3>
                <p className="text-muted-foreground mb-4">
                  Start building your custom finance dashboard by adding your first widget.
                </p>
                <Button onClick={() => setShowAddWidget(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Widget
                </Button>
              </div>
            </Card>
          </div>
        ) : (
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            onLayoutChange={handleLayoutChange}
            draggableHandle=".drag-handle"
            useCSSTransforms={true}
          >
            {widgets.map((widget) => (
              <div key={widget.id} className="widget-container">
                <WidgetContainer
                  widget={widget}
                  onClick={() => handleWidgetClick(widget.id)}
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </main>

      {/* Modals */}
      <AddWidgetModal
        open={showAddWidget}
        onOpenChange={setShowAddWidget}
      />
      
      <DashboardSettings
        open={showSettings}
        onOpenChange={setShowSettings}
      />
    </div>
  );
}
