import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WidgetMapping {
  [key: string]: string; // Maps widget field to JSON path
  symbols?: string; // Comma-separated list of stock symbols for stock table
  region?: 'USA' | 'India' | 'UK' | 'Global'; // Region selector for stock table
}

export interface WidgetConfig {
  apiSource: 'alphavantage' | 'custom';
  apiUrl?: string; // For custom API widgets
  refreshInterval: number; // seconds
  mapping: WidgetMapping;
}

export interface Widget {
  id: string;
  type: 'stock-table' | 'custom-table';
  title: string;
  config: WidgetConfig;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface WidgetsState {
  widgets: Widget[];
  selectedWidgetId: string | null;
}

const initialState: WidgetsState = {
  widgets: [],
  selectedWidgetId: null,
};

const widgetsSlice = createSlice({
  name: 'widgets',
  initialState,
  reducers: {
    addWidget: (state, action: PayloadAction<Omit<Widget, 'id'>>) => {
      const newWidget: Widget = {
        ...action.payload,
        id: `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      state.widgets.push(newWidget);
    },
    
    removeWidget: (state, action: PayloadAction<string>) => {
      state.widgets = state.widgets.filter(widget => widget.id !== action.payload);
      if (state.selectedWidgetId === action.payload) {
        state.selectedWidgetId = null;
      }
    },
    
    updateWidget: (state, action: PayloadAction<{ id: string; updates: Partial<Widget> }>) => {
      const { id, updates } = action.payload;
      const widgetIndex = state.widgets.findIndex(widget => widget.id === id);
      if (widgetIndex !== -1) {
        state.widgets[widgetIndex] = { ...state.widgets[widgetIndex], ...updates };
      }
    },
    
    updateWidgetConfig: (state, action: PayloadAction<{ id: string; config: Partial<WidgetConfig> }>) => {
      const { id, config } = action.payload;
      const widgetIndex = state.widgets.findIndex(widget => widget.id === id);
      if (widgetIndex !== -1) {
        state.widgets[widgetIndex].config = { ...state.widgets[widgetIndex].config, ...config };
      }
    },
    
    updateLayout: (state, action: PayloadAction<Array<{ i: string; x: number; y: number; w: number; h: number }>>) => {
      action.payload.forEach(layoutItem => {
        const widgetIndex = state.widgets.findIndex(widget => widget.id === layoutItem.i);
        if (widgetIndex !== -1) {
          state.widgets[widgetIndex] = {
            ...state.widgets[widgetIndex],
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          };
        }
      });
    },
    
    selectWidget: (state, action: PayloadAction<string | null>) => {
      state.selectedWidgetId = action.payload;
    },
    
    importDashboard: (state, action: PayloadAction<Widget[]>) => {
      state.widgets = action.payload;
      state.selectedWidgetId = null;
    },
    
    clearDashboard: (state) => {
      state.widgets = [];
      state.selectedWidgetId = null;
    },
  },
});

export const {
  addWidget,
  removeWidget,
  updateWidget,
  updateWidgetConfig,
  updateLayout,
  selectWidget,
  importDashboard,
  clearDashboard,
} = widgetsSlice.actions;

export default widgetsSlice.reducer;
