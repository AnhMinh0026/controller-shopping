import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminDashboardPage from "./pages/Admin";
import CartPage from "./pages/Cart";
import CheckoutPage from "./pages/Checkout";
import Home from "./pages/Home";
import LoginPage from "./pages/Login";
import ProductDetailPage from "./pages/ProductDetail";
import ProductsPage from "./pages/Products";
import ProfilePage from "./pages/Profile";
import SignUpPage from "./pages/SignUp";
import { useAuthStore } from "./store/useAuthStore";

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors theme="dark" closeButton />
      <Routes>
        {/* Public Routes (Guest, Customer & Admin) */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Authenticated Customer & Admin Routes */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={["customer", "admin"]}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["customer", "admin"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Admin-Only Route (RBAC: role === "admin") */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
