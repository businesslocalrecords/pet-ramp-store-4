import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './pages/index.tsx'
import { CartProvider } from './lib/cart'
import { initAnalytics } from './lib/analytics'
import { trackClick } from './lib/click-tracker'

// Initialize analytics on app load
initAnalytics({
  gaMeasurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
  googleAdsConversionId: import.meta.env.VITE_GOOGLE_ADS_CONVERSION_ID,
  metaPixelId: import.meta.env.VITE_META_PIXEL_ID,
  microsoftUetTagId: import.meta.env.VITE_MICROSOFT_UET_TAG_ID,
});

// Log the visit to clicks.txt (same endpoint the root domain uses)
trackClick();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </StrictMode>,
)
