import axiosClient from "../utils/axiosClient";

export type PaymentMethod = "qr" | "cod";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipping"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
}

export interface ShippingInfo {
  fullName: string;
  phone: string;
  address: string;
  note?: string;
}

export interface SepayTransactionInfo {
  transactionId?: string;
  gateway?: string;
  transferAmount?: number;
  referenceCode?: string;
  content?: string;
  paidAt?: string;
}

export interface TrackingLogEntry {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp: string;
}

export interface PaymentInstructions {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  transferContent: string;
  qrUrl: string;
  sepayConfigured: boolean;
}

export interface OrderRecord {
  id: string;
  orderCode: string;
  userId: string;
  customerAccount?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  items: OrderItem[];
  totalAmount: number;
  shippingInfo: ShippingInfo;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingCarrier?: string;
  trackingNumber?: string;
  cancelReason?: string;
  sepayTransaction?: SepayTransactionInfo;
  trackingLogs?: TrackingLogEntry[];
  paymentInstructions?: PaymentInstructions;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingInfo: ShippingInfo;
  paymentMethod: PaymentMethod;
  saveToProfile?: boolean;
}

export interface SepayConfigInfo {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isApiConfigured: boolean;
}

export interface AdminUpdateOrderPayload {
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  shippingCarrier?: string;
  trackingNumber?: string;
  cancelReason?: string;
}

export async function createOrder(
  payload: CreateOrderPayload,
): Promise<OrderRecord> {
  const response = await axiosClient.post<{
    success: boolean;
    data: OrderRecord;
  }>("/orders", payload);
  return response.data.data;
}

export async function getMyOrders(): Promise<OrderRecord[]> {
  const response = await axiosClient.get<{
    success: boolean;
    data: OrderRecord[];
  }>("/orders/my-orders");
  return response.data.data;
}

export async function getOrderById(id: string): Promise<OrderRecord> {
  const response = await axiosClient.get<{
    success: boolean;
    data: OrderRecord;
  }>(`/orders/${encodeURIComponent(id)}`);
  return response.data.data;
}

export async function checkOrderPayment(id: string): Promise<{
  paid: boolean;
  message: string;
  order: OrderRecord;
}> {
  const response = await axiosClient.post<{
    success: boolean;
    paid: boolean;
    message: string;
    data: OrderRecord;
  }>(`/orders/${encodeURIComponent(id)}/check-payment`);
  return {
    paid: response.data.paid,
    message: response.data.message,
    order: response.data.data,
  };
}

export async function confirmOrderReceived(id: string): Promise<OrderRecord> {
  const response = await axiosClient.post<{
    success: boolean;
    data: OrderRecord;
  }>(`/orders/${encodeURIComponent(id)}/confirm-received`);
  return response.data.data;
}

export async function cancelMyOrder(
  id: string,
  reason?: string,
): Promise<OrderRecord> {
  const response = await axiosClient.post<{
    success: boolean;
    data: OrderRecord;
  }>(`/orders/${encodeURIComponent(id)}/cancel`, { reason });
  return response.data.data;
}

// Admin Order & SePay APIs
export async function getAllOrdersAdmin(): Promise<{
  orders: OrderRecord[];
  sepayInfo: SepayConfigInfo;
}> {
  const response = await axiosClient.get<{
    success: boolean;
    data: OrderRecord[];
    sepayInfo: SepayConfigInfo;
  }>("/admin/orders");
  return {
    orders: response.data.data,
    sepayInfo: response.data.sepayInfo,
  };
}

export async function updateOrderStatusAdmin(
  id: string,
  payload: AdminUpdateOrderPayload,
): Promise<OrderRecord> {
  const response = await axiosClient.patch<{
    success: boolean;
    data: OrderRecord;
  }>(`/admin/orders/${encodeURIComponent(id)}/status`, payload);
  return response.data.data;
}

export async function syncSepayOrdersAdmin(): Promise<{
  message: string;
  checkedCount: number;
  matchedCount: number;
  matchedOrderCodes: string[];
  apiConfigured: boolean;
}> {
  const response = await axiosClient.post<{
    success: boolean;
    message: string;
    data: {
      checkedCount: number;
      matchedCount: number;
      matchedOrderCodes: string[];
      apiConfigured: boolean;
    };
  }>("/admin/orders/sepay-sync");
  return {
    message: response.data.message,
    ...response.data.data,
  };
}

export async function simulateSepayPaymentAdmin(
  id: string,
): Promise<OrderRecord> {
  const response = await axiosClient.post<{
    success: boolean;
    data: OrderRecord;
  }>(`/admin/orders/${encodeURIComponent(id)}/simulate-sepay`);
  return response.data.data;
}

export const orderService = {
  createOrder,
  getMyOrders,
  getOrderById,
  checkOrderPayment,
  confirmOrderReceived,
  cancelMyOrder,
  getAllOrdersAdmin,
  updateOrderStatusAdmin,
  syncSepayOrdersAdmin,
  simulateSepayPaymentAdmin,
};
