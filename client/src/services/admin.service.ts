import axiosClient from "../utils/axiosClient";
import type { UserRole } from "./auth.service";

export interface AdminStats {
  totalUsers: number;
  totalAdmins: number;
  totalCustomers: number;
  totalProducts: number;
  outOfStockProducts: number;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
}

export async function getAdminStats(): Promise<AdminStats> {
  const response = await axiosClient.get<{
    success: boolean;
    data: AdminStats;
  }>("/admin/stats");
  return response.data.data;
}

export async function getAllUsers(): Promise<AdminUserItem[]> {
  const response = await axiosClient.get<{
    success: boolean;
    data: AdminUserItem[];
  }>("/admin/users");
  return response.data.data;
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<{ message: string; data: AdminUserItem }> {
  const response = await axiosClient.patch<{
    success: boolean;
    message: string;
    data: AdminUserItem;
  }>(`/admin/users/${encodeURIComponent(userId)}/role`, { role });
  return response.data;
}

export async function deleteUser(userId: string): Promise<{ message: string }> {
  const response = await axiosClient.delete<{
    success: boolean;
    message: string;
  }>(`/admin/users/${encodeURIComponent(userId)}`);
  return response.data;
}

export const adminService = {
  getAdminStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
};

