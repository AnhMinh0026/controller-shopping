const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

/**
 * Formats a numeric value into Vietnamese Dong (e.g. 1890000 -> "1.890.000 ₫").
 */
export function formatVND(amount: number | null | undefined): string {
  const safeAmount =
    typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return vndFormatter.format(safeAmount);
}

