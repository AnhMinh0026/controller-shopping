import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { AdminViewType } from "../../../components/layout/AdminLayout/AdminSidebar";
import {
  adminService,
  type AdminStats,
  type AdminUserItem,
} from "../../../services/admin.service";
import type { UserRole } from "../../../services/auth.service";
import {
  productService,
  type Product,
  type UpsertProductPayload,
} from "../../../services/product.service";

export function useAdminDashboard() {
  const [currentView, setCurrentView] = useState<AdminViewType>("overview");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal State for Add / Edit Product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const [statsData, usersData, productsData] = await Promise.all([
        adminService.getAdminStats(),
        adminService.getAllUsers(),
        productService.getProducts(1, 100),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setProducts(productsData.data);
      if (!isSilent) {
        toast.success("Synchronized latest system data successfully.");
      }
    } catch {
      toast.error("Failed to refresh admin data.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    void Promise.all([
      adminService.getAdminStats(),
      adminService.getAllUsers(),
      productService.getProducts(1, 100),
    ])
      .then(([statsData, usersData, productsData]) => {
        if (!isMounted) return;
        setStats(statsData);
        setUsers(usersData);
        setProducts(productsData.data);
      })
      .catch(() => {
        if (!isMounted) return;
        toast.error("Failed to load admin dashboard data.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggleRole = async (target: AdminUserItem) => {
    const nextRole: UserRole = target.role === "admin" ? "customer" : "admin";
    try {
      const result = await adminService.updateUserRole(target.id, nextRole);
      setUsers((prev) =>
        prev.map((item) => (item.id === target.id ? result.data : item)),
      );
      const updatedStats = await adminService.getAdminStats();
      setStats(updatedStats);
      toast.success(
        `Updated role for "${target.name}" to ${nextRole.toUpperCase()}.`,
      );
    } catch {
      toast.error("Failed to update role for this user.");
    }
  };

  const handleDeleteUser = async (target: AdminUserItem) => {
    try {
      await adminService.deleteUser(target.id);
      setUsers((prev) => prev.filter((item) => item.id !== target.id));
      const updatedStats = await adminService.getAdminStats();
      setStats(updatedStats);
      toast.success(`User account "${target.name}" deleted successfully.`);
    } catch {
      toast.error("Failed to delete user account.");
    }
  };

  const handleSaveProduct = async (
    payload: UpsertProductPayload,
    slug?: string,
  ) => {
    setIsSavingProduct(true);
    try {
      if (slug) {
        await productService.updateProduct(slug, payload);
        toast.success(`Updated product "${payload.name}" successfully.`);
      } else {
        await productService.createProduct(payload);
        toast.success(`Created new product "${payload.name}" successfully.`);
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
      await loadData(true);
    } catch {
      toast.error("Failed to save product. Please check input values.");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!product.slug) return;
    try {
      await productService.deleteProduct(product.slug);
      toast.success(`Deleted product "${product.name}" successfully.`);
      await loadData(true);
    } catch {
      toast.error("Failed to delete product.");
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  return {
    currentView,
    setCurrentView,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    stats,
    users,
    products,
    isLoading,
    isRefreshing,
    isProductModalOpen,
    editingProduct,
    isSavingProduct,
    loadData,
    handleToggleRole,
    handleDeleteUser,
    handleSaveProduct,
    handleDeleteProduct,
    handleOpenAddModal,
    handleOpenEditModal,
    handleCloseModal,
  };
}
