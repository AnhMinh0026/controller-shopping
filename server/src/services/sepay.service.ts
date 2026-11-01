import crypto from "crypto";
import Order, { type IOrder, type ISepayTransaction } from "../models/Order";

export interface PaymentInstructions {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  transferContent: string;
  qrUrl: string;
  sepayConfigured: boolean;
}

export interface SepayApiTransaction {
  id: string;
  bank_brand_name: string;
  account_number: string;
  transaction_date: string;
  amount_out: string;
  amount_in: string;
  accumulated: string;
  transaction_content: string;
  reference_number: string;
  code?: string | null;
}

export interface SepayWebhookPayload {
  id?: number | string;
  gateway?: string;
  transactionDate?: string;
  accountNumber?: string;
  code?: string | null;
  content?: string;
  transferType?: "in" | "out" | string;
  transferAmount?: number;
  accumulated?: number;
  subAccount?: string | null;
  referenceCode?: string;
  description?: string;
}

export function getSepayConfig() {
  const bankCode = (process.env.SEPAY_BANK_CODE || "MBBank").trim();
  const accountNumber = (
    process.env.SEPAY_BANK_ACCOUNT || "091234567899"
  ).trim();
  const accountName = (
    process.env.SEPAY_ACCOUNT_NAME || "FLYDIGI VIETNAM OFFICIAL"
  ).trim();
  const apiToken = (process.env.SEPAY_API_TOKEN || "").trim();
  const webhookApiKey = (process.env.SEPAY_WEBHOOK_API_KEY || "").trim();

  return {
    bankCode,
    accountNumber,
    accountName,
    apiToken,
    webhookApiKey,
    isApiConfigured: Boolean(apiToken),
  };
}

export function generateOrderCode(): string {
  const chars = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.randomBytes(6);
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    const byte = bytes[i] ?? 0;
    suffix += chars[byte % chars.length] ?? "0";
  }
  return `FDG${suffix}`;
}

export function buildPaymentInstructions(
  orderCode: string,
  amount: number,
): PaymentInstructions {
  const config = getSepayConfig();
  const roundedAmount = Math.max(0, Math.round(amount));
  const qrUrl = `https://qr.sepay.vn/img?acc=${encodeURIComponent(
    config.accountNumber,
  )}&bank=${encodeURIComponent(
    config.bankCode,
  )}&amount=${roundedAmount}&des=${encodeURIComponent(orderCode)}`;

  return {
    bankCode: config.bankCode,
    accountNumber: config.accountNumber,
    accountName: config.accountName,
    amount: roundedAmount,
    transferContent: orderCode,
    qrUrl,
    sepayConfigured: config.isApiConfigured,
  };
}

export function extractOrderCodeFromContent(rawContent: string): string | null {
  if (!rawContent) return null;
  const match = rawContent.toUpperCase().match(/FDG[0-9A-Z]{6}/);
  return match ? match[0] : null;
}

export async function fetchSepayTransactions(
  limit = 50,
): Promise<SepayApiTransaction[]> {
  const { apiToken } = getSepayConfig();
  if (!apiToken) {
    return [];
  }

  const response = await fetch(
    `https://my.sepay.vn/userapi/transactions/list?limit=${limit}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`SePay API returned status ${response.status}`);
  }

  const data = (await response.json()) as {
    status?: number;
    transactions?: SepayApiTransaction[];
  };

  return Array.isArray(data.transactions) ? data.transactions : [];
}

export async function checkOrderViaSepayApi(
  order: IOrder,
): Promise<ISepayTransaction | null> {
  const transactions = await fetchSepayTransactions(50);
  if (transactions.length === 0) return null;

  const codeUpper = order.orderCode.toUpperCase();

  for (const tx of transactions) {
    const contentUpper = (tx.transaction_content || "").toUpperCase();
    const amountIn = parseFloat(tx.amount_in || "0");

    if (contentUpper.includes(codeUpper) && amountIn >= order.totalAmount) {
      return {
        transactionId: String(tx.id),
        gateway: tx.bank_brand_name || "SePay",
        transferAmount: amountIn,
        referenceCode: tx.reference_number || "",
        content: tx.transaction_content || "",
        paidAt: tx.transaction_date ? new Date(tx.transaction_date) : new Date(),
      };
    }
  }

  return null;
}

export async function syncPendingOrdersWithSepay(): Promise<{
  checkedCount: number;
  matchedCount: number;
  matchedOrderCodes: string[];
  apiConfigured: boolean;
}> {
  const { isApiConfigured } = getSepayConfig();
  const pendingQrOrders = await Order.find({
    paymentMethod: "qr",
    paymentStatus: "unpaid",
    orderStatus: { $in: ["pending", "processing"] },
  });

  if (!isApiConfigured || pendingQrOrders.length === 0) {
    return {
      checkedCount: pendingQrOrders.length,
      matchedCount: 0,
      matchedOrderCodes: [],
      apiConfigured: isApiConfigured,
    };
  }

  const transactions = await fetchSepayTransactions(100);
  const matchedOrderCodes: string[] = [];

  for (const order of pendingQrOrders) {
    const codeUpper = order.orderCode.toUpperCase();
    const matchedTx = transactions.find((tx) => {
      const contentUpper = (tx.transaction_content || "").toUpperCase();
      const amountIn = parseFloat(tx.amount_in || "0");
      return contentUpper.includes(codeUpper) && amountIn >= order.totalAmount;
    });

    if (matchedTx) {
      order.paymentStatus = "paid";
      if (order.orderStatus === "pending") {
        order.orderStatus = "processing";
        order.confirmedAt = new Date();
      }
      order.sepayTransaction = {
        transactionId: String(matchedTx.id),
        gateway: matchedTx.bank_brand_name || "SePay",
        transferAmount: parseFloat(matchedTx.amount_in || "0"),
        referenceCode: matchedTx.reference_number || "",
        content: matchedTx.transaction_content || "",
        paidAt: matchedTx.transaction_date
          ? new Date(matchedTx.transaction_date)
          : new Date(),
      };
      order.trackingLogs.push({
        status: "processing",
        title: "Payment Verified via SePay",
        description: `Received transfer via ${matchedTx.bank_brand_name || "SePay"} (Ref: ${matchedTx.reference_number || "N/A"}). Seller is preparing your package.`,
        timestamp: new Date(),
      });
      await order.save();
      matchedOrderCodes.push(order.orderCode);
    }
  }

  return {
    checkedCount: pendingQrOrders.length,
    matchedCount: matchedOrderCodes.length,
    matchedOrderCodes,
    apiConfigured: true,
  };
}
