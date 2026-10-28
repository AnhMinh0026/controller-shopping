import {
  CheckCircle2,
  Mail,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { AdminUserItem } from "../../../services/admin.service";
import { useAuthStore } from "../../../store/useAuthStore";

interface UsersViewProps {
  users: AdminUserItem[];
  onToggleRole: (user: AdminUserItem) => void;
  onDeleteUser: (user: AdminUserItem) => void;
}

type RoleFilter = "all" | "admin" | "customer";

export default function UsersView({
  users,
  onToggleRole,
  onDeleteUser,
}: UsersViewProps) {
  const currentUser = useAuthStore((state) => state.user);

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        u.name.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q));

      const matchesRole =
        roleFilter === "all" ? true : u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const adminCount = users.filter((u) => u.role === "admin").length;
  const customerCount = users.filter((u) => u.role === "customer").length;

  return (
    <div className="space-y-5">
      {/* Search & Role Filter Toolbar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#0f111a] p-4 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo họ tên, email hoặc số điện thoại..."
            className="w-full rounded-xl border border-white/10 bg-black/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:border-brand focus:outline-none"
          />
        </div>

        {/* Role Filters */}
        <div className="flex rounded-xl border border-white/10 bg-black/60 p-1">
          <button
            type="button"
            onClick={() => setRoleFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              roleFilter === "all"
                ? "bg-brand text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Tất cả ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("admin")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              roleFilter === "admin"
                ? "bg-brand text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Admin ({adminCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter("customer")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              roleFilter === "customer"
                ? "bg-cyan-500 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Customer ({customerCount})</span>
          </button>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f111a] shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="border-b border-white/10 bg-white/[0.02] text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <tr>
                <th className="py-3.5 pl-6 pr-4">Thành Viên</th>
                <th className="px-4 py-3.5">Liên Hệ (Email / Phone)</th>
                <th className="px-4 py-3.5">Xác Thực</th>
                <th className="px-4 py-3.5">Vai Trò (Role)</th>
                <th className="py-3.5 pl-4 pr-6 text-right">Phân Quyền / Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    <Users className="mx-auto mb-2 h-8 w-8 text-gray-600" />
                    Không tìm thấy thành viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  const isAdmin = u.role === "admin";

                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      {/* Name + Avatar */}
                      <td className="py-4 pl-6 pr-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold uppercase shadow-sm ${
                              isAdmin
                                ? "bg-gradient-to-tr from-brand to-cyan-400 text-white shadow-brand/20"
                                : "bg-white/10 text-gray-300"
                            }`}
                          >
                            {u.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="truncate font-bold text-white">
                                {u.name}
                              </p>
                              {isSelf && (
                                <span className="rounded bg-brand/20 px-1.5 py-0.5 text-[9px] font-bold text-brand">
                                  BẠN
                                </span>
                              )}
                            </div>
                            <p className="font-mono text-[10px] text-gray-500">
                              ID: {u.id.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email / Phone */}
                      <td className="px-4 py-4 font-mono text-gray-300">
                        {u.email && (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-gray-500" />
                            <span>{u.email}</span>
                          </div>
                        )}
                        {u.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3 w-3 text-gray-500" />
                            <span>{u.phone}</span>
                          </div>
                        )}
                        {!u.email && !u.phone && "—"}
                      </td>

                      {/* Verification Status */}
                      <td className="px-4 py-4">
                        {u.isEmailVerified || u.isPhoneVerified ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Đã xác minh</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-500">
                            <span>Chưa xác minh</span>
                          </span>
                        )}
                      </td>

                      {/* Role Pill */}
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
                            isAdmin
                              ? "border border-brand/50 bg-brand/15 text-brand shadow-sm shadow-brand/20"
                              : "border border-white/10 bg-white/5 text-gray-300"
                          }`}
                        >
                          {isAdmin ? (
                            <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                          ) : (
                            <UserCheck className="h-3.5 w-3.5 text-gray-400" />
                          )}
                          <span>{u.role}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-4 pr-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => onToggleRole(u)}
                            title={
                              isSelf
                                ? "Không thể tự hạ quyền của chính bạn"
                                : isAdmin
                                  ? "Hạ xuống quyền Customer"
                                  : "Nâng lên quyền Admin"
                            }
                            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                              isAdmin
                                ? "border-white/15 bg-white/5 text-gray-300 hover:border-amber-400/40 hover:text-amber-300 disabled:opacity-40"
                                : "border-brand/40 bg-brand/10 text-white hover:bg-brand disabled:opacity-40"
                            }`}
                          >
                            <Shield className="h-3.5 w-3.5" />
                            <span>
                              {isAdmin ? "Hạ Customer" : "Cấp Admin"}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={isSelf}
                            onClick={() => onDeleteUser(u)}
                            title={
                              isSelf
                                ? "Không thể xóa tài khoản của chính bạn"
                                : "Xóa tài khoản này"
                            }
                            className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-rose-300 transition-colors hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
