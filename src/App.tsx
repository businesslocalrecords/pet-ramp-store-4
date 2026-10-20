import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Shell } from './components/Shell';
import { HomePage } from './pages/HomePage';
import { CategoryPage } from './pages/CategoryPage';
import { CatalogProductPage } from './pages/CatalogProductPage';
import RampPage from './pages/index';
import {
  AboutPage,
  ContactPage,
  GuidePage,
  StairsGuidePage,
  PrivacyPage,
  ReturnsPage,
  ShippingPage,
  TermsPage,
  WarrantyPage,
} from './pages/InfoPages';

export default function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dog-ramps" element={<CategoryPage />} />
          <Route path="/products/foldable-dog-car-ramp" element={<RampPage />} />
          <Route path="/products/:handle" element={<CatalogProductPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/about/" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/contact/" element={<ContactPage />} />
          <Route path="/shipping" element={<ShippingPage />} />
          <Route path="/shipping/" element={<ShippingPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/returns/" element={<ReturnsPage />} />
          <Route path="/warranty" element={<WarrantyPage />} />
          <Route path="/warranty/" element={<WarrantyPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/privacy/" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/terms/" element={<TermsPage />} />
          <Route path="/guide/how-to-choose-a-dog-car-ramp" element={<GuidePage />} />
          <Route path="/guide/how-to-choose-a-dog-car-ramp/" element={<GuidePage />} />
          <Route path="/guide/dog-stairs-for-bed-or-couch" element={<StairsGuidePage />} />
          <Route path="/guide/dog-stairs-for-bed-or-couch/" element={<StairsGuidePage />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}
