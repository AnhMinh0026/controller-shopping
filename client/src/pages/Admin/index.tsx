import { ConfigProvider, Spin, theme } from "antd";
import AdminHeader from "../../components/layout/AdminLayout/AdminHeader";
import AdminSidebar from "../../components/layout/AdminLayout/AdminSidebar";
import OverviewView from "./components/OverviewView";
import ProductModal from "./components/ProductModal";
import ProductsView from "./components/ProductsView";
import UsersView from "./components/UsersView";
import { useAdminDashboard } from "./hooks/useAdminDashboard";

export default function AdminDashboardPage() {
  const {
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
  } = useAdminDashboard();

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#285afa",
          colorBgContainer: "#0f111a",
          colorBgElevated: "#141724",
          borderRadius: 12,
        },
      }}
    >
      <div className="min-h-screen bg-[#07080d] text-white">
        {/* 1. Left Fixed Admin Navigation Sidebar */}
        <AdminSidebar
          currentView={currentView}
          onSelectView={setCurrentView}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* 2. Main Administration Canvas */}
        <div className="flex min-h-screen flex-col lg:pl-72">
          <AdminHeader
            currentView={currentView}
            onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
            onOpenAddProductModal={handleOpenAddModal}
            onRefreshData={() => void loadData(false)}
            isRefreshing={isRefreshing}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {isLoading ? (
              <div className="flex h-96 flex-col items-center justify-center gap-3">
                <Spin size="large" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Loading dashboard data...
                </p>
              </div>
            ) : currentView === "overview" ? (
              <OverviewView
                stats={stats}
                users={users}
                products={products}
                onNavigateTab={setCurrentView}
              />
            ) : currentView === "products" ? (
              <ProductsView
                products={products}
                onOpenAddModal={handleOpenAddModal}
                onEditProduct={handleOpenEditModal}
                onDeleteProduct={handleDeleteProduct}
              />
            ) : currentView === "users" ? (
              <UsersView
                users={users}
                onToggleRole={handleToggleRole}
                onDeleteUser={handleDeleteUser}
              />
            ) : null}
          </main>
        </div>

        {/* 3. Product Add / Edit Modal Dialog (Antd Modal + RHF + Zod) */}
        <ProductModal
          key={
            editingProduct?.slug ||
            (isProductModalOpen ? "open-modal" : "closed")
          }
          isOpen={isProductModalOpen}
          onClose={handleCloseModal}
          productToEdit={editingProduct}
          onSave={handleSaveProduct}
          isSaving={isSavingProduct}
        />
      </div>
    </ConfigProvider>
  );
}
