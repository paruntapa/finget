# Environment Setup for FinGet Dashboard

## Required Environment Variables

To run the FinGet dashboard, you only need to set up one environment variable:

### INDIAN_STOCK_API

```bash
INDIAN_STOCK_API=your_indian_api_key_here
```

**How to get your API key:**
1. Visit [indianapi.in](https://indianapi.in/)
2. Sign up for an account
3. Get your API key from the dashboard
4. Copy it to your `.env.local` file

## Setup Instructions

1. **Create environment file:**
   ```bash
   touch .env.local
   ```

2. **Add your API key:**
   ```bash
   echo "INDIAN_STOCK_API=your_actual_api_key" >> .env.local
   ```

3. **Start the development server:**
   ```bash
   bun run dev
   ```

## API Features Supported

The FinGet dashboard uses the following IndianAPI endpoints:

- **Stock List**: Get popular Indian stocks
- **Stock Prices**: Real-time stock quotes
- **Historical Data**: Daily, weekly, and monthly candlestick data

## Rate Limiting & Caching

- **API Quota**: 500 requests/month (IndianAPI free tier)
- **Frontend Caching**: Aggressive caching with RTK Query
- **Redux Persist**: Cached data persists across page reloads
- **Smart Polling**: 10-second intervals with cache-first strategy

## Security

- ✅ API key is server-side only (never exposed to client)
- ✅ Automatic rate limiting on API proxy
- ✅ CORS protection on all routes
- ✅ Environment variables are not committed to git

## Example .env.local file

```bash
# IndianAPI Configuration
INDIAN_STOCK_API=sk_live_your_actual_api_key_here
```

That's it! Just one environment variable and you're ready to go. 🚀
