import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import ScrollToTop from "@/components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";
import { lazy, Suspense } from "react";
import PageLoadingFallback from "@/components/layout/PageLoadingFallback";

// Eagerly loaded (critical path)
import Index from "./pages/Index";

// Lazy loaded pages
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Brands = lazy(() => import("./pages/Brands"));
const BrandDetail = lazy(() => import("./pages/BrandDetail"));
const Categories = lazy(() => import("./pages/Categories"));
const CategoryDetail = lazy(() => import("./pages/CategoryDetail"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));

// Auth pages
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));

// Customer pages
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/account/Orders"));
const OrderDetail = lazy(() => import("./pages/account/OrderDetail"));
const Messages = lazy(() => import("./pages/account/Messages"));

// Vendor pages
const VendorLayout = lazy(() => import("./components/layout/VendorLayout"));
const VendorDashboard = lazy(() => import("./pages/vendor/VendorDashboard"));
const VendorProducts = lazy(() => import("./pages/vendor/VendorProducts"));
const VendorOrders = lazy(() => import("./pages/vendor/VendorOrders"));
const VendorStore = lazy(() => import("./pages/vendor/VendorStore"));
const VendorRegister = lazy(() => import("./pages/vendor/VendorRegister"));
const VendorApplicationStatus = lazy(() => import("./pages/vendor/VendorApplicationStatus"));

const VendorReviews = lazy(() => import("./pages/vendor/VendorReviews"));
const VendorPromotions = lazy(() => import("./pages/vendor/VendorPromotions"));
const VendorAnalytics = lazy(() => import("./pages/vendor/VendorAnalytics"));
const VendorMessages = lazy(() => import("./pages/vendor/VendorMessages"));
const VendorFinances = lazy(() => import("@/pages/vendor/VendorFinances"));
const VendorMarketing = lazy(() => import("@/pages/vendor/VendorMarketing"));
const VendorPremium = lazy(() => import("@/pages/vendor/VendorPremium"));

// Admin pages
const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminVendors = lazy(() => import("./pages/admin/AdminVendors"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminApplications = lazy(() => import("./pages/admin/AdminApplications"));
const AdminVerifications = lazy(() => import("./pages/admin/AdminVerifications"));
const AdminPromotions = lazy(() => import("./pages/admin/AdminPromotions"));
const AdminDisputes = lazy(() => import("./pages/admin/AdminDisputes"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminVouchers = lazy(() => import("./pages/admin/AdminVouchers"));
const AdminLuckyPromo = lazy(() => import("./pages/admin/AdminLuckyPromo"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminFinances = lazy(() => import("./pages/admin/AdminFinances"));

// Customer pages extension
const Vouchers = lazy(() => import("./pages/account/Vouchers"));
const Disputes = lazy(() => import("./pages/account/Disputes"));
const Profile = lazy(() => import("./pages/account/Profile"));
const Wishlist = lazy(() => import("./pages/account/Wishlist"));
const AddAddress = lazy(() => import("./pages/account/AddAddress"));
const ToReview = lazy(() => import("./pages/account/ToReview"));
const Notifications = lazy(() => import("./pages/account/Notifications"));

// Static pages
const HelpCenter = lazy(() => import("./pages/static/HelpCenter"));
const FAQ = lazy(() => import("./pages/static/FAQ"));
const Contact = lazy(() => import("./pages/static/Contact"));
const Privacy = lazy(() => import("./pages/static/Privacy"));
const Terms = lazy(() => import("./pages/static/Terms"));
const Returns = lazy(() => import("./pages/static/Returns"));
const SellerGuidelines = lazy(() => import("./pages/static/SellerGuidelines"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes  
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <ScrollToTop />
            <Suspense fallback={<PageLoadingFallback />}>
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
                <Route
                  path="/account/notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/account/messages"
                  element={
                    <ProtectedRoute>
                      <Messages />
                    </ProtectedRoute>
                  }
                />

                {/* Vendor Application Routes */}
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

                  <Route path="reviews" element={<VendorReviews />} />
                  <Route path="promotions" element={<VendorPromotions />} />
                  <Route path="analytics" element={<VendorAnalytics />} />
                  <Route path="messages" element={<VendorMessages />} />
                  <Route path="finances" element={<VendorFinances />} />
                  <Route path="marketing" element={<VendorMarketing />} />
                  <Route path="premium" element={<VendorPremium />} />
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
                  <Route path="reports" element={<AdminReports />} />
                  <Route path="promotions" element={<AdminPromotions />} />
                  <Route path="vouchers" element={<AdminVouchers />} />
                  <Route path="lucky-promo" element={<AdminLuckyPromo />} />
                  <Route path="disputes" element={<AdminDisputes />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="finances" element={<AdminFinances />} />
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
            </Suspense>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
