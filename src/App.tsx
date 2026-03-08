import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import ScrollToTop from "@/components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";

// Public pages
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Brands from "./pages/Brands";
import BrandDetail from "./pages/BrandDetail";
import Categories from "./pages/Categories";
import CategoryDetail from "./pages/CategoryDetail";
import NotFound from "./pages/NotFound";
import ComingSoon from "./pages/ComingSoon";

// Auth pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Customer pages
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/account/Orders";
import OrderDetail from "./pages/account/OrderDetail";
import ForgotPassword from "./pages/auth/ForgotPassword";

// Vendor pages
import VendorLayout from "./components/layout/VendorLayout";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/VendorProducts";
import VendorOrders from "./pages/vendor/VendorOrders";
import VendorStore from "./pages/vendor/VendorStore";
import VendorRegister from "./pages/vendor/VendorRegister";
import VendorApplicationStatus from "./pages/vendor/VendorApplicationStatus";
import VendorVerification from "./pages/vendor/VendorVerification";
import VendorReviews from "./pages/vendor/VendorReviews";
import VendorPromotions from "./pages/vendor/VendorPromotions";
import VendorAnalytics from "./pages/vendor/VendorAnalytics";

// Admin pages
import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminVendors from "./pages/admin/AdminVendors";
import AdminReports from "./pages/admin/AdminReports";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminVerifications from "./pages/admin/AdminVerifications";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminPromotions from "./pages/admin/AdminPromotions";
import AdminDisputes from "./pages/admin/AdminDisputes";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminVouchers from "./pages/admin/AdminVouchers";
import AdminLuckyPromo from "./pages/admin/AdminLuckyPromo";
import AdminUsers from "./pages/admin/AdminUsers";

// Customer pages extension
import Vouchers from "./pages/account/Vouchers";
import Disputes from "./pages/account/Disputes";
import Profile from "./pages/account/Profile";
import Wishlist from "./pages/account/Wishlist";
import AddAddress from "./pages/account/AddAddress";
import ToReview from "./pages/account/ToReview";

// Static pages
import HelpCenter from "./pages/static/HelpCenter";
import FAQ from "./pages/static/FAQ";
import Contact from "./pages/static/Contact";
import Privacy from "./pages/static/Privacy";
import Terms from "./pages/static/Terms";
import Returns from "./pages/static/Returns";
import SellerGuidelines from "./pages/static/SellerGuidelines";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/brands/:slug" element={<BrandDetail />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/categories/:slug" element={<CategoryDetail />} />

              {/* Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/vendor/login" element={<Navigate to="/login" replace />} />

              {/* Customer Routes */}
              <Route path="/cart" element={<Cart />} />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/orders"
                element={
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/account/orders/:orderId"
                element={
                  <ProtectedRoute>
                    <OrderDetail />
                  </ProtectedRoute>
                }
              />

              {/* Vendor Application Routes (no vendor role required) */}
              <Route path="/vendor/register" element={<VendorRegister />} />
              <Route path="/vendor/application-status" element={<VendorApplicationStatus />} />
              <Route path="/vendor/guidelines" element={<SellerGuidelines />} />

              {/* Vendor Dashboard Routes */}
              <Route
                path="/vendor"
                element={
                <ProtectedRoute requireAuth requireVendor>
                    <VendorLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<VendorDashboard />} />
                <Route path="products" element={<VendorProducts />} />
                <Route path="orders" element={<VendorOrders />} />
                <Route path="store" element={<VendorStore />} />
                <Route path="verification" element={<VendorVerification />} />
                <Route path="reviews" element={<VendorReviews />} />
                <Route path="promotions" element={<VendorPromotions />} />
              </Route>

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requireAuth requireAdmin>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="vendors" element={<AdminVendors />} />
                <Route path="applications" element={<AdminApplications />} />
                <Route path="verifications" element={<AdminVerifications />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="promotions" element={<AdminPromotions />} />
                <Route path="vouchers" element={<AdminVouchers />} />
                <Route path="lucky-promo" element={<AdminLuckyPromo />} />
                <Route path="disputes" element={<AdminDisputes />} />
                <Route path="analytics" element={<AdminAnalytics />} />
              </Route>

              {/* Customer Account Routes */}
              <Route path="/account/vouchers" element={<ProtectedRoute><Vouchers /></ProtectedRoute>} />
              <Route path="/account/disputes" element={<ProtectedRoute><Disputes /></ProtectedRoute>} />
              <Route path="/account/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/account/wishlist" element={<ProtectedRoute><Wishlist /></ProtectedRoute>} />
              <Route path="/account/add-address" element={<ProtectedRoute><AddAddress /></ProtectedRoute>} />
              <Route path="/account/to-review" element={<ProtectedRoute><ToReview /></ProtectedRoute>} />

              {/* Static Pages */}
              <Route path="/help" element={<HelpCenter />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/returns" element={<Returns />} />

              {/* Coming Soon */}
              <Route path="/coming-soon" element={<ComingSoon />} />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
