import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import SellerSignup from './pages/SellerSignup';
import CustomerSignup from './pages/CustomerSignup';
import DeliverySignup from './pages/DeliverySignup';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';
import SellerOnboarding from './pages/SellerOnboarding';
import Discovery from './pages/Discovery';
import StoreFront from './pages/StoreFront';
import BusinessDetails from './pages/BusinessDetails';
import ProductDetails from './pages/ProductDetails';
import Profile from './pages/Profile';
import { ToastProvider } from './components/ToastProvider';
import { 
  getCurrentRole, 
  getWorkspacePath
} from './utils/auth';
import { Navigate } from 'react-router-dom';

function PublicOnlyRoute({ children }) {
  const token = localStorage.getItem('token');
  const role = getCurrentRole();
  if (token) {
    return <Navigate to={getWorkspacePath(role) || '/discovery'} replace />;
  }
  return children;
}

function ProtectedRoute({ children, allowedRoles = [] }) {
  const token = localStorage.getItem('token');
  const role = getCurrentRole();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import Orders from './pages/Orders';
import Success from './pages/Success';
import Chat from './pages/Chat';
import Wishlist from './pages/Wishlist';
import FloatingChatButton from './components/FloatingChatButton';
import SellerDashboard from './pages/seller/Dashboard';
import SellerInventory from './pages/seller/Inventory';
import SellerOrders from './pages/seller/Orders';
import SellerOrderDetails from './pages/seller/OrderDetails';
import SellerProductForm from './pages/seller/ProductForm';
import SellerEarnings from './pages/seller/Earnings';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminCustomers from './pages/Admin/Customers';
import AdminOrders from './pages/Admin/Orders';
import AdminSellers from './pages/Admin/Sellers';
import AdminProducts from './pages/Admin/Products';
import AdminCategories from './pages/Admin/Categories';
import AdminCustomerDetails from './pages/Admin/CustomerDetails';
import AdminSellerDetails from './pages/Admin/SellerDetails';
import AdminProductDetails from './pages/Admin/ProductDetails';
import AdminLayout from './components/AdminLayout';
import SellerLayout from './components/SellerLayout';
import About from './pages/About';
import NotFound from './pages/NotFound';
import ErrorBoundary from './components/ErrorBoundary';
import SplashLoader from './components/SplashLoader';

function LayoutWrapper({ children }) {
  const { pathname } = useLocation();
  
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  
  // Hide main navbar/footer on auth pages and dashboard layouts
  const isAuthPage = ['/login', '/verify-email'].some(p => pathname.startsWith(p)) || pathname.includes('/signup');
  const isDashboard = pathname.startsWith('/admin') || pathname.startsWith('/seller');
  
  const hideNav = isAuthPage || isDashboard;

  return (
    <>
      {!hideNav && (
        <ErrorBoundary>
          <Navbar />
          <FloatingChatButton />
        </ErrorBoundary>
      )}
      {children}
      {!hideNav && <Footer />}
    </>
  );
}

function App() {
  const [showSplash, setShowSplash] = React.useState(() => !sessionStorage.getItem('hasSeenSplash'));

  const handleSplashComplete = () => {
    setShowSplash(false);
    sessionStorage.setItem('hasSeenSplash', 'true');
  };

  if (showSplash) {
    return <SplashLoader onComplete={handleSplashComplete} />;
  }

  return (
    <ToastProvider>
      <Router>
        <LayoutWrapper>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup/seller" element={<PublicOnlyRoute><SellerSignup /></PublicOnlyRoute>} />
            <Route path="/signup/customer" element={<PublicOnlyRoute><CustomerSignup /></PublicOnlyRoute>} />
            <Route path="/signup/delivery" element={<PublicOnlyRoute><DeliverySignup /></PublicOnlyRoute>} />
            <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/seller/onboarding" element={<ProtectedRoute allowedRoles={['seller']}><SellerOnboarding /></ProtectedRoute>} />
            <Route path="/discovery" element={<Discovery />} />
            <Route path="/stores" element={<Discovery />} />
            <Route path="/about" element={<About />} />
            <Route path="/store/:sellerId" element={<StoreFront />} />
            <Route path="/business/:businessId" element={<BusinessDetails />} />
            <Route path="/product/:productId" element={<ProductDetails />} />
            <Route path="/cart" element={<ProtectedRoute allowedRoles={['user']}><Cart /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute allowedRoles={['user']}><Checkout /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute allowedRoles={['user']}><Orders /></ProtectedRoute>} />
            <Route path="/orders/:orderId" element={<ProtectedRoute allowedRoles={['user']}><OrderTracking /></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/chat/:userId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/success" element={<ProtectedRoute><Success /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute allowedRoles={['user']}><Wishlist /></ProtectedRoute>} />

            {/* SELLER STUDIO */}
            <Route path="/seller" element={<ProtectedRoute allowedRoles={['seller']}><SellerLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<SellerDashboard />} />
              <Route path="inventory" element={<SellerInventory />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="orders/:orderId" element={<SellerOrderDetails />} />
              <Route path="earnings" element={<SellerEarnings />} />
              <Route path="products/new" element={<SellerProductForm />} />
              <Route path="products/:productId/edit" element={<SellerProductForm />} />
              <Route path="settings" element={<Profile initialTab="settings" />} />
              <Route path="chat" element={<Chat />} />
              <Route path="chat/:userId" element={<Chat />} />
            </Route>
            {/* ADMIN SUITE */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="customers/:customerId" element={<AdminCustomerDetails />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="sellers" element={<AdminSellers />} />
              <Route path="sellers/:userId" element={<AdminSellerDetails />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/:productId" element={<AdminProductDetails />} />
              <Route path="categories" element={<AdminCategories />} />
            </Route>


            <Route path="*" element={<NotFound />} />
          </Routes>
        </LayoutWrapper>
      </Router>
    </ToastProvider>
  );
}

export default App;
