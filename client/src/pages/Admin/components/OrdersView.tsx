import {
  Button,
  Input,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  MapPin,
  PackageCheck,
  Phone,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  XCircle,
  Zap,
} from "lucide-react";
import { useState } from "react";
import type {
  OrderRecord,
  OrderStatus,
  SepayConfigInfo,
} from "../../../services/order.service";
import { formatVND } from "../../../utils/formatCurrency";

interface OrdersViewProps {
  orders: OrderRecord[];
  sepayInfo: SepayConfigInfo | null;
  isSyncingSepay: boolean;
  onSyncSepay: () => Promise<void>;
  onSimulateSepay: (order: OrderRecord) => Promise<void>;
  onUpdateStatus: (
    order: OrderRecord,
    nextStatus: OrderStatus,
    extra?: {
      shippingCarrier?: string;
      trackingNumber?: string;
      cancelReason?: string;
    },
  ) => Promise<void>;
}

const ORDER_STATUS_TAG: Record<
  OrderStatus,
  { color: string; label: string }
> = {
  pending: { color: "gold", label: "To Confirm / Pay" },
  processing: { color: "processing", label: "To Ship (Packing)" },
  shipping: { color: "purple", label: "In Transit" },
  delivered: { color: "success", label: "Completed" },
  cancelled: { color: "error", label: "Cancelled" },
};

const CARRIER_OPTIONS = [
  { value: "SPX Express", label: "SPX Express (Shopee Express)" },
  { value: "GHN Express", label: "Giao Hang Nhanh (GHN)" },
  { value: "GHTK", label: "Giao Hang Tiet Kiem (GHTK)" },
  { value: "Viettel Post", label: "Viettel Post" },
];

function generateDefaultTracking(carrier: string): string {
  const prefix =
    carrier === "GHN Express"
      ? "GHN"
      : carrier === "GHTK"
        ? "GHTK"
        : carrier === "Viettel Post"
          ? "VTP"
          : "SPXVN";
  return `${prefix}${Date.now().toString().slice(-8)}`;
}

export default function OrdersView({
  orders,
  sepayInfo,
  isSyncingSepay,
  onSyncSepay,
  onSimulateSepay,
  onUpdateStatus,
}: OrdersViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [inspectingOrder, setInspectingOrder] = useState<OrderRecord | null>(
    null,
  );

  // Arrange Shipment Modal State (Shopee Seller Center style)
  const [shippingModalOrder, setShippingModalOrder] =
    useState<OrderRecord | null>(null);
  const [selectedCarrier, setSelectedCarrier] = useState("SPX Express");
  const [trackingCode, setTrackingCode] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);

  // Summary metrics
  const toConfirmCount = orders.filter(
    (o) => o.orderStatus === "pending",
  ).length;
  const toShipCount = orders.filter(
    (o) => o.orderStatus === "processing",
  ).length;
  const shippingCount = orders.filter(
    (o) => o.orderStatus === "shipping",
  ).length;
  const deliveredRevenue = orders
    .filter((o) => o.orderStatus === "delivered" || o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const openArrangeShipmentModal = (order: OrderRecord) => {
    const defaultCarrier = order.shippingCarrier || "SPX Express";
    setSelectedCarrier(defaultCarrier);
    setTrackingCode(
      order.trackingNumber || generateDefaultTracking(defaultCarrier),
    );
    setShippingModalOrder(order);
  };

  const handleConfirmArrangeShipment = async () => {
    if (!shippingModalOrder) return;
    setIsDispatching(true);
    try {
      await onUpdateStatus(shippingModalOrder, "shipping", {
        shippingCarrier: selectedCarrier,
        trackingNumber:
          trackingCode.trim() || generateDefaultTracking(selectedCarrier),
      });
      setShippingModalOrder(null);
    } finally {
      setIsDispatching(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      order.orderCode.toLowerCase().includes(q) ||
      order.shippingInfo.fullName.toLowerCase().includes(q) ||
      order.shippingInfo.phone.toLowerCase().includes(q) ||
      order.shippingInfo.address.toLowerCase().includes(q) ||
      (order.trackingNumber || "").toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL" || order.orderStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const columns: ColumnsType<OrderRecord> = [
    {
      title: "Order Code",
      dataIndex: "orderCode",
      key: "orderCode",
      width: 140,
      render: (code: string, record) => (
        <div>
          <span className="font-mono text-xs font-black text-brand">
            #{code}
          </span>
          <p className="mt-0.5 text-[11px] text-gray-500">
            {new Date(record.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      ),
    },
    {
      title: "Customer & Delivery Address",
      key: "customer",
      width: 270,
      render: (_, record) => (
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 font-bold text-white">
            <span>{record.shippingInfo.fullName}</span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-normal text-cyan-400">
              <Phone className="h-3 w-3" />
              {record.shippingInfo.phone}
            </span>
          </div>
          <p className="line-clamp-2 flex items-start gap-1 text-[11px] text-gray-400">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-brand" />
            <span>{record.shippingInfo.address}</span>
          </p>
        </div>
      ),
    },
    {
      title: "Items & Total",
      key: "totalAmount",
      width: 170,
      render: (_, record) => {
        const itemCount = record.items.reduce((s, i) => s + i.quantity, 0);
        return (
          <div>
            <p className="text-sm font-black text-white">
              {formatVND(record.totalAmount)}
            </p>
            <p className="text-[11px] text-gray-400">
              {itemCount} item(s) • {record.items[0]?.name}
              {record.items.length > 1 ? ` +${record.items.length - 1}` : ""}
            </p>
          </div>
        );
      },
    },
    {
      title: "Payment (SePay / COD)",
      key: "payment",
      width: 190,
      render: (_, record) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <Tag
              color={record.paymentMethod === "qr" ? "blue" : "cyan"}
              className="m-0 font-bold uppercase"
            >
              {record.paymentMethod === "qr" ? "VietQR • SePay" : "COD"}
            </Tag>
            <Tag
              color={record.paymentStatus === "paid" ? "success" : "warning"}
              className="m-0 font-bold uppercase"
            >
              {record.paymentStatus === "paid"
                ? "Paid"
                : record.paymentMethod === "cod"
                  ? "Collect COD"
                  : "Unpaid"}
            </Tag>
          </div>
          {record.sepayTransaction?.referenceCode && (
            <p className="font-mono text-[10px] text-emerald-400">
              Ref: {record.sepayTransaction.referenceCode}
            </p>
          )}
        </div>
      ),
    },
    {
      title: "Status & Carrier",
      dataIndex: "orderStatus",
      key: "orderStatus",
      width: 180,
      render: (status: OrderStatus, record) => {
        const badge = ORDER_STATUS_TAG[status];
        return (
          <div className="space-y-1">
            <Tag
              color={badge.color}
              className="px-2.5 py-0.5 font-bold uppercase"
            >
              {badge.label}
            </Tag>
            {record.shippingCarrier && record.trackingNumber && (
              <p className="font-mono text-[10px] text-purple-300">
                {record.shippingCarrier}: {record.trackingNumber}
              </p>
            )}
          </div>
        );
      },
    },
    {
      title: "Seller Actions (Shopee Flow)",
      key: "actions",
      width: 270,
      render: (_, record) => {
        const isUnpaidQr =
          record.paymentMethod === "qr" &&
          record.paymentStatus === "unpaid" &&
          record.orderStatus === "pending";

        const isPendingCod =
          record.paymentMethod === "cod" && record.orderStatus === "pending";

        const canArrangeShipment = record.orderStatus === "processing";
        const canDeliver = record.orderStatus === "shipping";
        const canCancel =
          record.orderStatus !== "delivered" &&
          record.orderStatus !== "cancelled";

        return (
          <Space size="small" wrap>
            {/* Inspect Full Order */}
            <Tooltip title="View order & tracking timeline">
              <Button
                size="small"
                icon={<Eye className="h-3.5 w-3.5" />}
                onClick={() => setInspectingOrder(record)}
              />
            </Tooltip>

            {/* Step 1A: Confirm COD Order (Pending -> To Ship) */}
            {isPendingCod && (
              <Popconfirm
                title="Confirm COD Order (Accept & Pack)"
                description={`Confirm COD order #${record.orderCode} for ${record.shippingInfo.fullName} (${record.shippingInfo.phone}) and move to "To Ship"?`}
                okText="Confirm & Pack"
                cancelText="Cancel"
                onConfirm={() => void onUpdateStatus(record, "processing")}
              >
                <Button
                  size="small"
                  type="primary"
                  icon={<ClipboardCheck className="h-3.5 w-3.5" />}
                >
                  Confirm COD
                </Button>
              </Popconfirm>
            )}

            {/* Step 1B: SePay Verify / Simulate Button for Unpaid QR orders */}
            {isUnpaidQr && (
              <Popconfirm
                title="Verify SePay QR Transaction"
                description={`Confirm that ${formatVND(record.totalAmount)} with content "${record.orderCode}" was received via SePay?`}
                okText="Verify Payment"
                cancelText="Cancel"
                onConfirm={() => void onSimulateSepay(record)}
              >
                <Button
                  size="small"
                  type="primary"
                  icon={<Zap className="h-3.5 w-3.5" />}
                >
                  Verify SePay
                </Button>
              </Popconfirm>
            )}

            {/* Step 2: Arrange Shipment / Hand Over to Carrier (Processing -> Shipping) */}
            {canArrangeShipment && (
              <Button
                size="small"
                type="primary"
                className="bg-purple-600 hover:bg-purple-500"
                icon={<Truck className="h-3.5 w-3.5" />}
                onClick={() => openArrangeShipmentModal(record)}
              >
                Arrange Shipment
              </Button>
            )}

            {/* Step 3: Mark as Delivered & Collect COD */}
            {canDeliver && (
              <Popconfirm
                title="Confirm Delivery & COD Collection"
                description={
                  record.paymentMethod === "cod"
                    ? `Confirm courier delivered #${record.orderCode} and collected ${formatVND(record.totalAmount)} COD?`
                    : `Mark order #${record.orderCode} as delivered to customer?`
                }
                okText="Confirm Delivered"
                cancelText="Cancel"
                onConfirm={() => void onUpdateStatus(record, "delivered")}
              >
                <Button
                  size="small"
                  type="primary"
                  className="bg-emerald-600 hover:bg-emerald-500"
                  icon={<PackageCheck className="h-3.5 w-3.5" />}
                >
                  Delivered
                </Button>
              </Popconfirm>
            )}

            {/* Cancel Order */}
            {canCancel && (
              <Popconfirm
                title="Cancel Order & Restore Stock"
                description={`Cancel order #${record.orderCode} and restore item quantities to inventory?`}
                okText="Cancel Order"
                okButtonProps={{ danger: true }}
                cancelText="Keep"
                onConfirm={() =>
                  void onUpdateStatus(record, "cancelled", {
                    cancelReason: "Cancelled by Seller (Out of delivery area / Unreachable)",
                  })
                }
              >
                <Button
                  size="small"
                  danger
                  icon={<XCircle className="h-3.5 w-3.5" />}
                />
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top KPI Cards (Shopee Seller Center Metrics) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              To Confirm / Pay
            </span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">
            {toConfirmCount}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            New COD orders & pending QR transfers
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              To Ship (Packing)
            </span>
            <QrCode className="h-4 w-4 text-brand" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">{toShipCount}</p>
          <p className="mt-1 text-[11px] text-gray-500">
            Confirmed orders awaiting carrier pickup
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              In Transit
            </span>
            <Truck className="h-4 w-4 text-purple-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">{shippingCount}</p>
          <p className="mt-1 text-[11px] text-gray-500">
            Handed to carrier • Delivering to customer
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0f111a] p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Completed Revenue
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-400">
            {formatVND(deliveredRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-gray-500">
            From SePay QR & collected COD orders
          </p>
        </div>
      </div>

      {/* SePay Auto-Verification Gateway Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-brand/30 bg-gradient-to-r from-brand/10 via-[#0f111a] to-[#0f111a] p-5 lg:flex-row lg:items-center">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/20 text-brand">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black uppercase tracking-wide text-white">
                SePay Automatic Transaction Checker & COD Fulfillment
              </h3>
              <Tag color="success" className="m-0 font-bold">
                Webhook Ready: POST /api/orders/sepay-webhook
              </Tag>
            </div>
            <p className="mt-1 text-xs text-gray-400">
              Receiving Account:{" "}
              <strong className="text-white">
                {sepayInfo?.bankCode || "MBBank"} •{" "}
                {sepayInfo?.accountNumber || "091234567899"} (
                {sepayInfo?.accountName || "FLYDIGI VIETNAM OFFICIAL"})
              </strong>
              . QR orders auto-verify via memo{" "}
              <code className="text-brand">FDGXXXXXX</code>; COD orders follow
              Confirm → Arrange Shipment → Delivered.
            </p>
          </div>
        </div>

        <Button
          type="primary"
          loading={isSyncingSepay}
          onClick={() => void onSyncSepay()}
          icon={<RefreshCw className="h-4 w-4" />}
          className="h-10 rounded-xl px-5 font-bold uppercase tracking-wider"
        >
          Sync SePay Transactions
        </Button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#0f111a] p-4 sm:flex-row sm:items-center">
        <Input
          allowClear
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Order Code (#FDG...), tracking number, customer name, phone..."
          prefix={<Search className="mr-1.5 h-4 w-4 text-gray-400" />}
          className="max-w-md"
        />

        <Segmented
          value={statusFilter}
          onChange={(val) => setStatusFilter(String(val))}
          options={[
            { label: `All (${orders.length})`, value: "ALL" },
            { label: "To Confirm / Pay", value: "pending" },
            { label: "To Ship", value: "processing" },
            { label: "In Transit", value: "shipping" },
            { label: "Completed", value: "delivered" },
          ]}
        />
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0f111a]">
        <Table<OrderRecord>
          rowKey="id"
          columns={columns}
          dataSource={filteredOrders}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1080 }}
        />
      </div>

      {/* Shopee Seller Center: Arrange Shipment Modal */}
      <Modal
        open={Boolean(shippingModalOrder)}
        onCancel={() => setShippingModalOrder(null)}
        onOk={() => void handleConfirmArrangeShipment()}
        confirmLoading={isDispatching}
        okText="Hand Over to Carrier"
        title={
          shippingModalOrder
            ? `Arrange Shipment • Order #${shippingModalOrder.orderCode}`
            : "Arrange Shipment"
        }
      >
        {shippingModalOrder && (
          <div className="mt-4 space-y-4 text-xs text-gray-300">
            <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-brand">
                Recipient & Destination
              </p>
              <p className="mt-1 font-bold text-white">
                {shippingModalOrder.shippingInfo.fullName} •{" "}
                <span className="font-mono text-cyan-400">
                  {shippingModalOrder.shippingInfo.phone}
                </span>
              </p>
              <p className="mt-1 text-gray-400">
                {shippingModalOrder.shippingInfo.address}
              </p>
              <div className="mt-2 border-t border-white/10 pt-2">
                <span className="text-gray-400">COD Collection Amount: </span>
                <strong className="text-amber-300">
                  {shippingModalOrder.paymentMethod === "cod" &&
                  shippingModalOrder.paymentStatus !== "paid"
                    ? `${formatVND(shippingModalOrder.totalAmount)} (Collect Cash on Delivery)`
                    : "0 ₫ (Prepaid via SePay QR)"}
                </strong>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-300">
                Select Shipping Carrier
              </label>
              <Select
                value={selectedCarrier}
                onChange={(val) => {
                  setSelectedCarrier(val);
                  setTrackingCode(generateDefaultTracking(val));
                }}
                options={CARRIER_OPTIONS}
                className="w-full"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-300">
                Waybill / Tracking Number
              </label>
              <Input
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                placeholder="e.g. SPXVN12345678"
                className="font-mono"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Order Detail & Tracking Timeline Modal */}
      <Modal
        open={Boolean(inspectingOrder)}
        onCancel={() => setInspectingOrder(null)}
        footer={[
          <Button key="close" onClick={() => setInspectingOrder(null)}>
            Close
          </Button>,
        ]}
        title={
          inspectingOrder
            ? `Order Details • #${inspectingOrder.orderCode}`
            : "Order Details"
        }
        width={680}
      >
        {inspectingOrder && (
          <div className="mt-4 space-y-4 text-xs text-gray-300">
            {/* Customer Shipping Card */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand">
                Customer Delivery Destination
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <span className="text-gray-400">Recipient Name: </span>
                  <strong className="text-white">
                    {inspectingOrder.shippingInfo.fullName}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400">Phone Number: </span>
                  <strong className="font-mono text-cyan-400">
                    {inspectingOrder.shippingInfo.phone}
                  </strong>
                </div>
              </div>
              <div className="mt-2">
                <span className="text-gray-400">Shipping Address: </span>
                <strong className="text-white">
                  {inspectingOrder.shippingInfo.address}
                </strong>
              </div>
              {inspectingOrder.shippingCarrier &&
                inspectingOrder.trackingNumber && (
                  <div className="mt-2">
                    <span className="text-gray-400">Carrier & Tracking: </span>
                    <strong className="font-mono text-purple-300">
                      {inspectingOrder.shippingCarrier} •{" "}
                      {inspectingOrder.trackingNumber}
                    </strong>
                  </div>
                )}
              {inspectingOrder.shippingInfo.note && (
                <div className="mt-2">
                  <span className="text-gray-400">Customer Note: </span>
                  <span className="italic text-amber-300">
                    "{inspectingOrder.shippingInfo.note}"
                  </span>
                </div>
              )}
            </div>

            {/* SePay Transaction Metadata */}
            {inspectingOrder.sepayTransaction && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                  SePay Verified Transaction
                </p>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <span className="text-gray-400">Gateway / Bank: </span>
                    <strong className="text-white">
                      {inspectingOrder.sepayTransaction.gateway}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Reference Code: </span>
                    <strong className="font-mono text-emerald-300">
                      {inspectingOrder.sepayTransaction.referenceCode}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Transfer Amount: </span>
                    <strong className="text-white">
                      {formatVND(
                        inspectingOrder.sepayTransaction.transferAmount || 0,
                      )}
                    </strong>
                  </div>
                  <div>
                    <span className="text-gray-400">Transfer Content: </span>
                    <strong className="font-mono text-white">
                      {inspectingOrder.sepayTransaction.content}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Parcel Tracking Logs */}
            {Array.isArray(inspectingOrder.trackingLogs) &&
              inspectingOrder.trackingLogs.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Parcel Tracking Timeline
                  </p>
                  <div className="space-y-2.5">
                    {[...inspectingOrder.trackingLogs]
                      .reverse()
                      .map((log, idx) => (
                        <div
                          key={`${log.timestamp}-${idx}`}
                          className="flex items-start justify-between gap-3 border-b border-white/5 pb-2 last:border-b-0 last:pb-0"
                        >
                          <div>
                            <p
                              className={`font-bold ${
                                idx === 0 ? "text-brand" : "text-white"
                              }`}
                            >
                              {log.title}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {log.description}
                            </p>
                          </div>
                          <span className="shrink-0 text-[10px] text-gray-500">
                            {new Date(log.timestamp).toLocaleString("en-US", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

            {/* Ordered Items */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Ordered Items ({inspectingOrder.items.length})
              </p>
              <div className="divide-y divide-white/10">
                {inspectingOrder.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-10 w-10 rounded-lg border border-white/10 bg-black object-contain p-1"
                      />
                      <div>
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-[11px] text-gray-400">
                          {item.quantity} × {formatVND(item.price)}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-white">
                      {formatVND(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-sm font-black">
                <span className="text-gray-300">Total Order Amount</span>
                <span className="text-brand">
                  {formatVND(inspectingOrder.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
