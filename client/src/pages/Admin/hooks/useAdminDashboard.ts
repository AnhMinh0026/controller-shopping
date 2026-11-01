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
  orderService,
  type OrderRecord,
  type OrderStatus,
  type SepayConfigInfo,
} from "../../../services/order.service";
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
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [sepayInfo, setSepayInfo] = useState<SepayConfigInfo | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncingSepay, setIsSyncingSepay] = useState(false);

  // Modal State for Add / Edit Product
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const [statsData, usersData, productsData, ordersResult] =
        await Promise.all([
          adminService.getAdminStats(),
          adminService.getAllUsers(),
          productService.getProducts(1, 100),
          orderService.getAllOrdersAdmin(),
        ]);
      setStats(statsData);
      setUsers(usersData);
      setProducts(productsData.data);
      setOrders(ordersResult.orders);
      setSepayInfo(ordersResult.sepayInfo);
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
      orderService.getAllOrdersAdmin(),
    ])
      .then(([statsData, usersData, productsData, ordersResult]) => {
        if (!isMounted) return;
        setStats(statsData);
        setUsers(usersData);
        setProducts(productsData.data);
        setOrders(ordersResult.orders);
        setSepayInfo(ordersResult.sepayInfo);
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

  const handleSyncSepay = async () => {
    setIsSyncingSepay(true);
    try {
      const res = await orderService.syncSepayOrdersAdmin();
      toast.success(res.message);
      await loadData(true);
    } catch {
      toast.error("Failed to sync transactions with SePay.");
    } finally {
      setIsSyncingSepay(false);
    }
  };

  const handleSimulateSepay = async (order: OrderRecord) => {
    try {
      const updated = await orderService.simulateSepayPaymentAdmin(order.id);
      setOrders((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(
        `SePay transaction verified for Order #${order.orderCode}! Ready to ship.`,
      );
    } catch {
      toast.error("Failed to verify SePay payment.");
    }
  };

  const handleUpdateOrderStatus = async (
    order: OrderRecord,
    nextStatus: OrderStatus,
    extra?: {
      shippingCarrier?: string;
      trackingNumber?: string;
      cancelReason?: string;
    },
  ) => {
    try {
      const updated = await orderService.updateOrderStatusAdmin(order.id, {
        orderStatus: nextStatus,
        ...extra,
      });
      setOrders((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      if (nextStatus === "processing") {
        toast.success(
          `Confirmed COD Order #${order.orderCode}! Moved to "To Ship".`,
        );
      } else if (nextStatus === "shipping") {
        toast.success(
          `Order #${order.orderCode} handed over to ${updated.shippingCarrier || "carrier"} (${updated.trackingNumber || ""})!`,
        );
      } else if (nextStatus === "delivered") {
        toast.success(
          `Order #${order.orderCode} delivered & payment completed!`,
        );
      } else if (nextStatus === "cancelled") {
        toast.info(`Order #${order.orderCode} cancelled & stock restored.`);
        await loadData(true);
      } else {
        toast.success(`Order #${order.orderCode} status updated.`);
      }
    } catch {
      toast.error("Failed to update order status.");
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
    orders,
    sepayInfo,
    isLoading,
    isRefreshing,
    isSyncingSepay,
    isProductModalOpen,
    editingProduct,
    isSavingProduct,
    loadData,
    handleToggleRole,
    handleDeleteUser,
    handleSaveProduct,
    handleDeleteProduct,
    handleSyncSepay,
    handleSimulateSepay,
    handleUpdateOrderStatus,
    handleOpenAddModal,
    handleOpenEditModal,
    handleCloseModal,
  };
}
