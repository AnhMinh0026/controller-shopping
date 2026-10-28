import { useCallback, useEffect, useState } from "react";
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

export interface FeedbackMessage {
  type: "success" | "error";
  text: string;
}

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

  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

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
    } catch {
      setFeedback({
        type: "error",
        text: "Không thể làm mới dữ liệu quản trị.",
      });
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
        setFeedback({
          type: "error",
          text: "Không thể tải dữ liệu quản trị.",
        });
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
    setFeedback(null);
    try {
      const result = await adminService.updateUserRole(target.id, nextRole);
      setUsers((prev) =>
        prev.map((item) => (item.id === target.id ? result.data : item)),
      );
      const updatedStats = await adminService.getAdminStats();
      setStats(updatedStats);
      setFeedback({
        type: "success",
        text: `Đã thay đổi vai trò của "${target.name}" thành ${nextRole.toUpperCase()}.`,
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Không thể thay đổi quyền tài khoản này.",
      });
    }
  };

  const handleDeleteUser = async (target: AdminUserItem) => {
    if (
      !window.confirm(
        `Xác nhận xóa người dùng "${target.name}"? Hành động này không thể hoàn tác.`,
      )
    ) {
      return;
    }

    setFeedback(null);
    try {
      await adminService.deleteUser(target.id);
      setUsers((prev) => prev.filter((item) => item.id !== target.id));
      const updatedStats = await adminService.getAdminStats();
      setStats(updatedStats);
      setFeedback({
        type: "success",
        text: `Đã xóa tài khoản "${target.name}".`,
      });
    } catch {
      setFeedback({
        type: "error",
        text: "Không thể xóa tài khoản này.",
      });
    }
  };

  const handleSaveProduct = async (
    payload: UpsertProductPayload,
    slug?: string,
  ) => {
    setIsSavingProduct(true);
    setFeedback(null);

    try {
      if (slug) {
        await productService.updateProduct(slug, payload);
        setFeedback({
          type: "success",
          text: `Đã cập nhật sản phẩm "${payload.name}".`,
        });
      } else {
        await productService.createProduct(payload);
        setFeedback({
          type: "success",
          text: `Đã thêm sản phẩm mới "${payload.name}".`,
        });
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
      await loadData(true);
    } catch {
      setFeedback({
        type: "error",
        text: "Lỗi lưu sản phẩm. Vui lòng kiểm tra lại thông tin.",
      });
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!product.slug) return;
    if (
      !window.confirm(`Xác nhận xóa sản phẩm "${product.name}" khỏi hệ thống?`)
    ) {
      return;
    }

    setFeedback(null);
    try {
      await productService.deleteProduct(product.slug);
      setFeedback({
        type: "success",
        text: `Đã xóa sản phẩm "${product.name}".`,
      });
      await loadData(true);
    } catch {
      setFeedback({
        type: "error",
        text: "Không thể xóa sản phẩm này.",
      });
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
    feedback,
    setFeedback,
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

