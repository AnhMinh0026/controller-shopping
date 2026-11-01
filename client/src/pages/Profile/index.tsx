import { MapPin, Package } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "../../components/layout/Header/Header";
import CustomerOrdersList from "./components/CustomerOrdersList";
import ProfileSettingsForm from "./components/ProfileSettingsForm";

export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "orders" ? "orders" : "profile";
  const [activeTab, setActiveTab] = useState<"profile" | "orders">(initialTab);

  const handleSwitchTab = (tab: "profile" | "orders") => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-xs uppercase tracking-widest text-gray-400"
        >
          <Link to="/" className="transition-colors hover:text-white">
            Home
          </Link>
          <span>/</span>
          <span className="font-semibold text-brand">My Profile & Orders</span>
        </nav>

        {/* Page Header & Tab Switcher */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand">
              CUSTOMER ACCOUNT CENTER
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-wide text-white sm:text-4xl">
              Profile & Order Tracking
            </h1>
          </div>

          <div className="inline-flex rounded-full border border-white/10 bg-[#0b0b0f] p-1">
            <button
              type="button"
              onClick={() => handleSwitchTab("profile")}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "profile"
                  ? "bg-brand text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Address & Phone</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab("orders")}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "orders"
                  ? "bg-brand text-white shadow"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Package className="h-3.5 w-3.5" />
              <span>My Orders</span>
            </button>
          </div>
        </div>

        {/* Active View */}
        <div className="mt-8">
          {activeTab === "profile" ? (
            <ProfileSettingsForm />
          ) : (
            <CustomerOrdersList />
          )}
        </div>
      </main>
    </div>
  );
}

