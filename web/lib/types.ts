export type Color = { name: string; hex: string };

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: number;
  mrp: number;
  stock: number;
  lowStockAt: number;
  categoryId: string;
  category?: { name: string; slug: string };
  models: string[];
  colors: Color[];
  images: string[];
  art: string;
  pattern: string;
  featured: boolean;
  isNew: boolean;
  trending: boolean;
  status: 'PUBLISHED' | 'DRAFT';
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt?: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  art: string;
  color: string;
  image?: string;
  sort: number;
  count: number;
};

export type Review = { id: string; name: string; rating: number; comment: string; createdAt: string; approved?: boolean; verified?: boolean; product?: { name: string; slug: string } };

export type User = { id: string; name: string; email: string; phone: string | null; role: 'CUSTOMER' | 'ADMIN'; createdAt: string };

export type Address = { id: string; fullName: string; phone: string; line1: string; line2: string | null; city: string; state: string; pincode: string; isDefault: boolean };

export type OrderItem = { id: string; productId: string | null; name: string; sku: string; model: string | null; color: string | null; colorHex: string; art: string; pattern: string; image: string | null; price: number; qty: number };

export type OrderStatus = 'PENDING_PAYMENT' | 'PLACED' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';

export type Partner = { id: string; name: string; contactPerson: string | null; phone: string | null; trackingUrl: string; codSupported: boolean; active: boolean; active_orders?: number; delivered?: number };

export type Order = {
  id: string;
  number: string;
  userId: string | null;
  customerName: string;
  email: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  shipping: number;
  codFee: number;
  discount: number;
  total: number;
  couponCode: string | null;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  status: OrderStatus;
  partnerId: string | null;
  partner?: Partial<Partner> | null;
  trackingNumber: string | null;
  note: string | null;
  createdAt: string;
  items: OrderItem[];
  events?: { id: string; status: OrderStatus; note: string | null; createdAt: string }[];
};

export type Settings = {
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  shippingFee: string;
  freeShippingAbove: string;
  codEnabled: string;
  codFee: string;
  announcement: string;
  onlinePayments?: string;
};
