import mongoose, { Document, Schema, Types } from "mongoose";

export type PaymentMethod = "qr" | "cod";
export type PaymentStatus = "unpaid" | "paid" | "refunded";
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipping"
  | "delivered"
  | "cancelled";

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
}

export interface IShippingInfo {
  fullName: string;
  phone: string;
  address: string;
  note?: string;
}

export interface ISepayTransaction {
  transactionId?: string;
  gateway?: string;
  transferAmount?: number;
  referenceCode?: string;
  content?: string;
  paidAt?: Date;
}

export interface ITrackingLog {
  status: OrderStatus;
  title: string;
  description: string;
  timestamp: Date;
}

export interface IOrder extends Document {
  orderCode: string;
  user: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  shippingInfo: IShippingInfo;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  shippingCarrier?: string;
  trackingNumber?: string;
  cancelReason?: string;
  sepayTransaction?: ISepayTransaction;
  trackingLogs: ITrackingLog[];
  confirmedAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const shippingInfoSchema = new Schema<IShippingInfo>(
  {
    fullName: {
      type: String,
      required: [true, "Recipient full name is required"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Recipient phone number is required"],
      trim: true,
    },
    address: {
      type: String,
      required: [true, "Shipping address is required"],
      trim: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false },
);

const sepayTransactionSchema = new Schema<ISepayTransaction>(
  {
    transactionId: { type: String },
    gateway: { type: String },
    transferAmount: { type: Number },
    referenceCode: { type: String },
    content: { type: String },
    paidAt: { type: Date },
  },
  { _id: false },
);

const trackingLogSchema = new Schema<ITrackingLog>(
  {
    status: {
      type: String,
      enum: ["pending", "processing", "shipping", "delivered", "cancelled"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrder>(
  {
    orderCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [
        (val: IOrderItem[]) => val.length > 0,
        "Order must contain at least one item",
      ],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingInfo: {
      type: shippingInfoSchema,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["qr", "cod"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    orderStatus: {
      type: String,
      enum: ["pending", "processing", "shipping", "delivered", "cancelled"],
      default: "pending",
    },
    shippingCarrier: {
      type: String,
      trim: true,
    },
    trackingNumber: {
      type: String,
      trim: true,
    },
    cancelReason: {
      type: String,
      trim: true,
    },
    sepayTransaction: {
      type: sepayTransactionSchema,
      default: undefined,
    },
    trackingLogs: {
      type: [trackingLogSchema],
      default: [],
    },
    confirmedAt: {
      type: Date,
    },
    shippedAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const Order = mongoose.model<IOrder>("Order", orderSchema);
export default Order;
