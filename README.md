# FinGet - Customizable Finance Dashboard

A modern, production-ready finance dashboard built with Next.js, TypeScript, and shadcn/ui. Create custom widgets, visualize financial data with beautiful charts, and manage multiple data sources with ease.

![FinGet Dashboard](https://img.shields.io/badge/React-18+-blue) ![Next.js](https://img.shields.io/badge/Next.js-15+-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3+-cyan)

## ✨ Features

### 🎛️ **Simplified Widget System**
- **Drag & Drop Interface**: Rearrange widgets with intuitive grid-based layout
- **Two Focused Widget Types**: Stock Table (real-time quotes) and Custom API Table (any data source)
- **Streamlined Configuration**: Simple setup with regional stock lists and custom URLs
- **Real-time Updates**: Live data with 10-second refresh for stock charts

### 📊 **Advanced Charting**
- **Lightweight Charts**: High-performance candlestick and line charts
- **Interactive Features**: Crosshair, zoom, pan, and hover tooltips
- **Multiple Chart Types**: Switch between candlestick and line views
- **Responsive Design**: Charts adapt to container size automatically

### 🔌 **Streamlined Data Sources**
- **AlphaVantage Integration**: Professional stock data with intraday, daily, weekly, and monthly intervals
- **Regional Stock Lists**: Predefined symbols for USA and India markets
- **Custom API Support**: Connect any REST API endpoint with automatic table conversion
- **Intelligent Detection**: Auto-identifies stock-like data with upgrade suggestions
- **Unified API Routes**: Single AlphaVantage endpoint and generic proxy for custom URLs

### 🔄 **State Management & Persistence**
- **Redux Toolkit**: Robust state management with RTK Query
- **Local Persistence**: Dashboard layouts and settings saved automatically
- **Export/Import**: Backup and restore dashboard configurations
- **Cache Management**: Intelligent API response caching with TTL

### 🎨 **Modern UI/UX**
- **Dark/Light Themes**: Persistent theme switching with system detection
- **Responsive Layout**: Mobile-first design that works on all devices
- **Smooth Animations**: Framer Motion for polished interactions
- **Accessibility**: WCAG compliant with keyboard navigation

### 🛡️ **Production Ready**
- **Rate Limiting**: Built-in API rate limiting with configurable limits
- **Error Handling**: Comprehensive error states and user feedback
- **Type Safety**: Full TypeScript coverage for reliability
- **Performance**: Code splitting and lazy loading for optimal bundle size

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Optional: API keys for external data sources

### Installation

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd 24.finget
   bun install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your API keys:
   ```env
   ALPHA_VANTAGE_KEY=your_alphavantage_api_key_here
   FINNHUB_KEY=your_finnhub_api_key_here
   ```

3. **Start Development Server**
   ```bash
   bun dev
   ```

4. **Open Dashboard**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Adding Your First Widget

1. **Click "Add Widget"** in the top navigation
2. **Choose Widget Type**:
   - **Candlestick Chart**: For OHLCV price data visualization
   - **Stock Table**: Real-time stock quotes with AlphaVantage data
   - **Custom API Table**: For any external API data with smart detection
   - **Data Table**: For tabular financial metrics
   - **Info Card**: For single value displays
3. **Configure Data Source**:
   - **AlphaVantage**: Professional stock data with intraday, daily, weekly, monthly intervals
   - **Finnhub**: Alternative financial data provider
   - **Custom API**: Connect to any REST API endpoint
4. **Set Basic Options**: Title, symbol, refresh interval
5. **Click "Create Widget"**

### Configuring Custom APIs

1. **Add a Custom Widget** with "Custom API" as the data source
2. **Open Widget Settings** (gear icon on widget)
3. **Go to "Data Source" Tab**
4. **Enter API URL** and click "Test" to fetch sample data
5. **Switch to "Field Mapping" Tab**
6. **Use JSON Explorer** to map API fields to widget fields:
   - Click field names in the JSON structure
   - Select which widget field to map to (e.g., "price", "time")
   - Use suggested mappings for common patterns
   7. **Save Configuration**

### Using Stock Table Widget

1. **Add Stock Table Widget** - provides real-time stock quotes
2. **Default Stocks**: Shows AAPL, GOOGL, MSFT, AMZN, TSLA by default
3. **Search & Filter**: Use the search box to filter by symbol
4. **Click Row for Details**: Click any stock row to open detailed chart view
5. **Timeframe Selection**: In detail view, switch between 1D, 1W, 1M intervals
6. **Configure Symbols**: Edit widget settings to customize stock list

### Managing Dashboard Layout

- **Drag to Rearrange**: Use the grip handle (⋮) to drag widgets
- **Resize**: Drag widget corners to resize
- **Remove**: Click the X button on widget hover
- **Configure**: Click the gear icon to edit widget settings

### Export/Import Dashboard

1. **Open Settings** (gear icon in top navigation)
2. **Go to "Import/Export" Tab**
3. **Export**: Download your dashboard as JSON
4. **Import**: Upload a previously exported dashboard file
5. **Clear All**: Reset dashboard to empty state

## 🔧 API Integration

### Supported Data Sources

#### AlphaVantage
- **Free Tier**: 500 requests/day, 5 requests/minute
- **Data**: Real-time and historical stock data
- **Setup**: Get API key from [alphavantage.co](https://www.alphavantage.co/support/#api-key)

#### Finnhub
- **Free Tier**: 60 requests/minute
- **Data**: Stock prices, forex, crypto
- **Setup**: Get API key from [finnhub.io](https://finnhub.io/dashboard)

#### Custom APIs
- **Any REST Endpoint**: JSON responses supported
- **Field Mapping**: Visual JSON explorer for easy configuration
- **Rate Limiting**: Automatic protection against excessive requests

### Adding New Adapters

1. **Create Adapter File**: `src/lib/adapters/your-adapter.ts`
2. **Implement Parser Function**:
   ```typescript
   export function parseYourApiResponse(response: any): CandleData[] {
     // Transform API response to standard format
     return response.data.map(item => ({
       time: item.timestamp,
       open: item.open_price,
       high: item.high_price,
       low: item.low_price,
       close: item.close_price,
       volume: item.volume,
     }));
   }
   ```
3. **Add to Proxy Route**: Update `src/pages/api/proxy.ts`
4. **Update RTK Query**: Add new endpoint in `src/store/api/rtkApi.ts`

## 🏗️ Architecture

### Project Structure
```
src/
├── app/                 # Next.js app directory
├── components/
│   ├── dashboard/       # Dashboard shell and management
│   ├── widgets/         # Widget implementations
│   ├── ui/             # shadcn/ui components
│   └── providers/      # Context providers
├── store/
│   ├── api/            # RTK Query API definitions
│   └── slices/         # Redux state slices
├── lib/
│   ├── adapters/       # API data adapters
│   └── utils/          # Utility functions
└── pages/api/          # API routes (proxy, rate limiting)
```

### State Management
- **Redux Toolkit**: Global state management
- **RTK Query**: API caching and data fetching
- **Redux Persist**: Automatic state persistence

### Styling
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: High-quality component library
- **CSS Variables**: Theme-aware color system

## 🔧 Development

### Available Scripts
```bash
bun dev          # Start development server
bun build        # Build for production
bun start        # Start production server
bun lint         # Run ESLint
```

### Environment Variables
```env
ALPHA_VANTAGE_KEY=          # AlphaVantage API key
FINNHUB_KEY=                # Finnhub API key
NODE_ENV=development        # Environment mode
```

### Adding New Widget Types

1. **Create Widget Component**: `src/components/widgets/YourWidget/index.tsx`
2. **Implement Widget Interface**:
   ```typescript
   interface YourWidgetProps {
     widget: Widget;
   }
   
   export function YourWidget({ widget }: YourWidgetProps) {
     // Widget implementation
   }
   ```
3. **Register in WidgetContainer**: Update widget type mapping
4. **Add to AddWidgetModal**: Include in widget type selection

## 🚀 Deployment

### Vercel (Recommended)
1. **Connect Repository** to Vercel
2. **Add Environment Variables** in project settings
3. **Deploy**: Automatic deployments on push

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json bun.lockb ./
RUN npm install -g bun && bun install
COPY . .
RUN bun build
CMD ["bun", "start"]
```

### Environment Variables for Production
- Set all required API keys
- Configure rate limiting for production scale
- Consider using Redis for distributed rate limiting

## 🛠️ Advanced Features

### Rate Limiting
- **In-Memory**: Default development setup
- **Production**: See `ADVANCE.md` for Redis configuration
- **Configurable**: Adjust limits in `src/pages/api/rateLimit.ts`

### WebSocket Support
- **Placeholder Implementation**: Ready for real-time data
- **TODO Markers**: See code comments for implementation guidance
- **Documentation**: Check `ADVANCE.md` for setup instructions

### Performance Optimization
- **Code Splitting**: Dynamic imports for chart libraries
- **Lazy Loading**: Components loaded on demand
- **Caching**: Aggressive API response caching
- **Bundle Analysis**: Built-in webpack bundle analyzer

## 🤝 Contributing

1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/your-feature`
3. **Make Changes**: Follow existing code patterns
4. **Add Tests**: Ensure new features are tested
5. **Submit Pull Request**: Include detailed description

### Development Guidelines
- **TypeScript**: All new code must be typed
- **Components**: Use functional components with hooks
- **Styling**: Follow Tailwind CSS conventions
- **State**: Use Redux Toolkit for global state

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

### Common Issues

**Q: Charts not displaying**
- Check API keys are properly set
- Verify data source is responding
- Check browser console for errors

**Q: Widgets not saving**
- Ensure localStorage is available
- Check Redux DevTools for state changes
- Verify persistence configuration

**Q: Rate limit errors**
- Wait for rate limit reset
- Check API key quotas
- Consider upgrading API plans

### Getting Help
- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Community questions and ideas
- **Documentation**: Check `ADVANCE.md` for detailed guides

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies.**