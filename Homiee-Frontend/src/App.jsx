import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import SellerSignup from './pages/SellerSignup';
import CustomerSignup from './pages/CustomerSignup';
import DeliverySignup from './pages/DeliverySignup';
import Login from './pages/Login';
import SellerOnboarding from './pages/SellerOnboarding';
import Discovery from './pages/Discovery';
import StoreFront from './pages/StoreFront';
import BusinessDetails from './pages/BusinessDetails';
import ProductDetails from './pages/ProductDetails';
import Profile from './pages/Profile';
import { ToastProvider } from './components/ToastProvider';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import Orders from './pages/Orders';
import Success from './pages/Success';
import SellerDashboard from './pages/seller/Dashboard';
import SellerInventory from './pages/seller/Inventory';
import SellerOrders from './pages/seller/Orders';
import SellerOrderDetails from './pages/seller/OrderDetails';
import SellerProductForm from './pages/seller/ProductForm';
import AdminDashboard from './pages/Admin/Dashboard';
import AdminCustomers from './pages/Admin/Customers';
import AdminOrders from './pages/Admin/Orders';
import AdminSellers from './pages/Admin/Sellers';
import AdminProducts from './pages/Admin/Products';
import AdminCategories from './pages/Admin/Categories';
import AdminCustomerDetails from './pages/Admin/CustomerDetails';
import AdminSellerDetails from './pages/Admin/SellerDetails';
import AdminProductDetails from './pages/Admin/ProductDetails';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup/seller" element={<SellerSignup />} />
          <Route path="/signup/customer" element={<CustomerSignup />} />
          <Route path="/signup/delivery" element={<DeliverySignup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/seller/onboarding" element={<SellerOnboarding />} />
          <Route path="/discovery" element={<Discovery />} />
          <Route path="/store/:sellerId" element={<StoreFront />} />
          <Route path="/business/:businessId" element={<BusinessDetails />} />
          <Route path="/product/:productId" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:orderId" element={<OrderTracking />} />
          <Route path="/success" element={<Success />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/seller/dashboard" element={<SellerDashboard />} />
          <Route path="/seller/inventory" element={<SellerInventory />} />
          <Route path="/seller/orders" element={<SellerOrders />} />
          <Route path="/seller/orders/:orderId" element={<SellerOrderDetails />} />
          <Route path="/seller/products/new" element={<SellerProductForm />} />
          <Route path="/seller/products/:productId/edit" element={<SellerProductForm />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/customers/:customerId" element={<AdminCustomerDetails />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/sellers" element={<AdminSellers />} />
          <Route path="/admin/sellers/:userId" element={<AdminSellerDetails />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/:productId" element={<AdminProductDetails />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
