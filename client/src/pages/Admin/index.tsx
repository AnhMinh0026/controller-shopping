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
  } = useAdminDashboard();

  return (
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
          {/* Toast / Notification Banner */}
          {feedback && (
            <div
              role="alert"
              className={`mb-6 flex items-center justify-between rounded-2xl border p-4 text-xs font-semibold shadow-md ${
                feedback.type === "success"
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
                  : "border-rose-500/40 bg-rose-500/15 text-rose-200"
              }`}
            >
              <span>{feedback.text}</span>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-xs uppercase tracking-wider underline hover:opacity-80"
              >
                Đóng
              </button>
            </div>
          )}

          {/* Dynamic Content Views */}
          {isLoading ? (
            <div className="flex h-96 flex-col items-center justify-center gap-3">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-brand border-t-transparent" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                Đang tải dữ liệu quản trị...
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

      {/* 3. Product Add / Edit Modal Dialog */}
      <ProductModal
        key={editingProduct?.slug || (isProductModalOpen ? "open-modal" : "closed")}
        isOpen={isProductModalOpen}
        onClose={handleCloseModal}
        productToEdit={editingProduct}
        onSave={handleSaveProduct}
        isSaving={isSavingProduct}
      />
    </div>
  );
}
