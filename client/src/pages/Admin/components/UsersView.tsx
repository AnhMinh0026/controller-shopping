import { Popconfirm, Segmented, Table, Tag, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircle2,
  Mail,
  Phone,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
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

      const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const adminCount = users.filter((u) => u.role === "admin").length;
  const customerCount = users.filter((u) => u.role === "customer").length;

  const columns: ColumnsType<AdminUserItem> = [
    {
      title: "User",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_value, record) => {
        const isSelf = record.id === currentUser?.id;
        const isAdmin = record.role === "admin";
        return (
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold uppercase shadow-sm ${
                isAdmin
                  ? "bg-gradient-to-tr from-brand to-cyan-400 text-white shadow-brand/20"
                  : "bg-white/10 text-gray-300"
              }`}
            >
              {record.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-bold text-white">{record.name}</p>
                {isSelf && (
                  <Tag color="blue" className="m-0 text-[10px] font-bold">
                    YOU
                  </Tag>
                )}
              </div>
              <p className="font-mono text-[10px] text-gray-500">
                ID: {record.id.slice(-8)}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      title: "Contact (Email / Phone)",
      key: "contact",
      render: (_value, record) => (
        <div className="space-y-1 font-mono text-xs text-gray-300">
          {record.email && (
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-gray-500" />
              <span>{record.email}</span>
            </div>
          )}
          {record.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-gray-500" />
              <span>{record.phone}</span>
            </div>
          )}
          {!record.email && !record.phone && <span>—</span>}
        </div>
      ),
    },
    {
      title: "Verification",
      key: "verified",
      width: 150,
      render: (_value, record) =>
        record.isEmailVerified || record.isPhoneVerified ? (
          <Tag color="success" className="m-0 inline-flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Verified</span>
          </Tag>
        ) : (
          <Tag color="default" className="m-0">
            Unverified
          </Tag>
        ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 150,
      filters: [
        { text: "Admin", value: "admin" },
        { text: "Customer", value: "customer" },
      ],
      onFilter: (value, record) => record.role === value,
      render: (_value, record) => {
        const isAdmin = record.role === "admin";
        return isAdmin ? (
          <Tag
            color="processing"
            className="m-0 inline-flex items-center gap-1 font-bold uppercase"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>ADMIN</span>
          </Tag>
        ) : (
          <Tag className="m-0 inline-flex items-center gap-1 font-semibold uppercase">
            <UserCheck className="h-3.5 w-3.5" />
            <span>CUSTOMER</span>
          </Tag>
        );
      },
    },
    {
      title: "Access Control & Actions",
      key: "actions",
      align: "right",
      width: 210,
      render: (_value, record) => {
        const isSelf = record.id === currentUser?.id;
        const isAdmin = record.role === "admin";

        if (isSelf) {
          return (
            <Tooltip title="Current active admin account (cannot be demoted or deleted)">
              <span className="text-[11px] italic text-gray-500">
                Current Account
              </span>
            </Tooltip>
          );
        }

        return (
          <div className="inline-flex items-center gap-2">
            <Popconfirm
              title={
                isAdmin ? "Demote to Customer?" : "Promote to Admin?"
              }
              description={
                isAdmin
                  ? `"${record.name}" will lose administrative access to this portal.`
                  : `"${record.name}" will be granted full administrative privileges.`
              }
              okText="Confirm"
              cancelText="Cancel"
              onConfirm={() => onToggleRole(record)}
            >
              <button
                type="button"
                className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isAdmin
                    ? "border-white/15 bg-white/5 text-gray-300 hover:border-amber-400/40 hover:text-amber-300"
                    : "border-brand/40 bg-brand/10 text-white hover:bg-brand"
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                <span>{isAdmin ? "Demote" : "Promote"}</span>
              </button>
            </Popconfirm>

            <Popconfirm
              title="Delete this user?"
              description={`Permanently delete "${record.name}" and revoke all active sessions?`}
              okText="Delete User"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDeleteUser(record)}
            >
              <button
                type="button"
                aria-label={`Delete account for ${record.name}`}
                className="flex items-center gap-1 rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-rose-300 transition-colors hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* Search & Segmented Role Filter */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#0f111a] p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone number..."
            className="w-full rounded-xl border border-white/10 bg-black/60 py-2.5 pl-10 pr-4 text-xs text-white placeholder-gray-500 focus:border-brand focus:outline-none"
          />
        </div>

        <Segmented<RoleFilter>
          value={roleFilter}
          onChange={(val) => setRoleFilter(val)}
          options={[
            { label: `All (${users.length})`, value: "all" },
            { label: `Admin (${adminCount})`, value: "admin" },
            { label: `Customer (${customerCount})`, value: "customer" },
          ]}
        />
      </div>

      {/* Ant Design Users Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f111a] p-2 shadow-lg">
        <Table<AdminUserItem>
          rowKey="id"
          columns={columns}
          dataSource={filteredUsers}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            pageSizeOptions: [8, 16, 32],
            showTotal: (total) => `Total ${total} accounts`,
          }}
          scroll={{ x: 760 }}
        />
      </div>
    </div>
  );
}
