import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { CartProvider } from "@/lib/cart";
import CartDrawer from "@/components/CartDrawer";
import { LanguageProvider } from "@/lib/i18n";

import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Checkout from "@/pages/Checkout";
import Consultation from "@/pages/Consultation";
import Guide from "@/pages/Guide";
import Cart from "@/pages/Cart";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminProducts from "@/pages/AdminProducts";
import AdminOrders from "@/pages/AdminOrders";
import AdminChangePassword from "@/pages/AdminChangePassword";
import AdminConsultations from "@/pages/AdminConsultations";
import SmartDiagnosis from "@/pages/SmartDiagnosis";
import Learn from "@/pages/Learn";
import DeliveryLogin from "@/pages/DeliveryLogin";
import DeliveryOrders from "@/pages/DeliveryOrders";
import AdminDeliveryUsers from "@/pages/AdminDeliveryUsers";
import AdminCustomers from "@/pages/AdminCustomers";
import AdminReviews from "@/pages/AdminReviews";
import AdminEnrollments from "@/pages/AdminEnrollments";
import CustomerLogin from "@/pages/CustomerLogin";
import CustomerDashboard from "@/pages/CustomerDashboard";
import TrackOrder from "@/pages/TrackOrder";
import WasteCollection from "@/pages/WasteCollection";
import AdminWasteCollections from "@/pages/AdminWasteCollections";
import DonorAuth from "@/pages/DonorAuth";
import DonorDashboard from "@/pages/DonorDashboard";
import AdminDonors from "@/pages/AdminDonors";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/products" component={Products} />
      <Route path="/products/:id" component={ProductDetail} />
      <Route path="/order/:id" component={Checkout} />
      <Route path="/consultation" component={Consultation} />
      <Route path="/guide" component={Guide} />
      <Route path="/cart" component={Cart} />
      <Route path="/diagnosis" component={SmartDiagnosis} />
      <Route path="/learn" component={Learn} />
      
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/consultations" component={AdminConsultations} />
      <Route path="/admin/delivery" component={AdminDeliveryUsers} />
      <Route path="/admin/customers" component={AdminCustomers} />
      <Route path="/admin/reviews" component={AdminReviews} />
      <Route path="/admin/enrollments" component={AdminEnrollments} />
      <Route path="/admin/change-password" component={AdminChangePassword} />
      <Route path="/delivery/login" component={DeliveryLogin} />
      <Route path="/delivery/orders" component={DeliveryOrders} />

      <Route path="/customer/login" component={CustomerLogin} />
      <Route path="/customer/dashboard" component={CustomerDashboard} />
      <Route path="/track" component={TrackOrder} />
      <Route path="/track/:trackingNumber" component={TrackOrder} />

      <Route path="/admin/waste-collections" component={AdminWasteCollections} />
      <Route path="/admin/donors" component={AdminDonors} />
      <Route path="/waste-collection" component={WasteCollection} />
      <Route path="/donor/login" component={DonorAuth} />
      <Route path="/donor/dashboard" component={DonorDashboard} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <CartProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <CartDrawer />
            <Toaster />
          </CartProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </LanguageProvider>
  );
}

export default App;
