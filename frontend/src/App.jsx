import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./LandingPage";
import Dashboard from "./Dashboard";
import Salons from "./Salons";
import SalonDetails from "./SalonDetails";
import BookAppointment from "./BookAppointment";
import Bookings from "./Bookings";
import BookingDetails from "./BookingDetails";
import EditBooking from "./EditBooking";
import Customers from "./Customers";
import CustomerDetails from "./CustomerDetails";
import AddCustomer from "./AddCustomer";
import EditCustomer from "./EditCustomer";
import Login from "./Login";
import Register from "./Register";
import ForgotPassword from "./ForgotPassword";
import OwnerDashboard from "./OwnerDashboard";
import OwnerSalon from "./OwnerSalon";
import OwnerServices from "./OwnerServices";
import OwnerStaff from "./OwnerStaff";
import OwnerBookings from "./OwnerBookings";
import OwnerCustomers from "./OwnerCustomers";
import OwnerProfile from "./OwnerProfile";
import AdminDashboard from "./AdminDashboard";
import CustomerProfile from "./CustomerProfile";
import MobileSimulator from "./MobileSimulator";
import ProtectedRoute from "./ProtectedRoute";
import { getUser } from "./auth";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root Route: Shows Public Marketing Landing Page */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/landing" element={<LandingPage />} />

        {/* Dedicated Customer Mobile App Simulator Flow */}
        <Route path="/mobile" element={<MobileSimulator />} />

        {/* Public Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Customer Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <CustomerProfile />
            </ProtectedRoute>
          }
        />

        {/* Authenticated Customer Dashboard / Home */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Salons Discovery */}
        <Route
          path="/salons"
          element={
            <ProtectedRoute>
              <Salons />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salons/:salon_id"
          element={
            <ProtectedRoute>
              <SalonDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/salon/:salon_id"
          element={
            <ProtectedRoute>
              <SalonDetails />
            </ProtectedRoute>
          }
        />

        {/* Customer Booking Flow */}
        <Route
          path="/book/:salon_id"
          element={
            <ProtectedRoute>
              <BookAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <Bookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:booking_id"
          element={
            <ProtectedRoute>
              <BookingDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-booking/:booking_id"
          element={
            <ProtectedRoute>
              <EditBooking />
            </ProtectedRoute>
          }
        />

        {/* Customers Management */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Customers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:customer_id"
          element={
            <ProtectedRoute>
              <CustomerDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-customer"
          element={
            <ProtectedRoute>
              <AddCustomer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-customer/:customer_id"
          element={
            <ProtectedRoute>
              <EditCustomer />
            </ProtectedRoute>
          }
        />

        {/* Salon Owner Portal Routes */}
        <Route
          path="/owner/dashboard"
          element={
            <ProtectedRoute allowedRoles={["SALON_OWNER", "ADMIN"]}>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/salon"
          element={
            <ProtectedRoute allowedRoles={["SALON_OWNER", "ADMIN"]}>
              <OwnerSalon />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/services"
          element={
            <ProtectedRoute allowedRoles={["SALON_OWNER", "ADMIN"]}>
              <OwnerServices />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/staff"
          element={
            <ProtectedRoute allowedRoles={["SALON_OWNER", "ADMIN"]}>
              <OwnerStaff />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/bookings"
          element={
            <ProtectedRoute allowedRoles={["SALON_OWNER", "ADMIN"]}>
              <OwnerBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/customers"
          element={
            <ProtectedRoute allowedRoles={["SALON_OWNER", "ADMIN"]}>
              <OwnerCustomers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner/profile"
          element={
            <ProtectedRoute allowedRoles={["SALON_OWNER", "ADMIN"]}>
              <OwnerProfile />
            </ProtectedRoute>
          }
        />

        {/* Platform Admin Dashboard Route */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;