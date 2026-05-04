const getBaseUrl = () =>
  `https://${process.env.EXPO_PUBLIC_DOMAIN ?? "localhost"}`;

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
  weightKg: number | null;
  imageUrl: string;
  stock: number;
  active: boolean;
  category: string;
  createdAt: string;
}

export interface CustomerOrder {
  id: number;
  trackingNumber: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  city: string;
  address: string;
  createdAt: string;
  assignedDriverName: string | null;
  subscriptionId: number | null;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
}

export interface WasteCollection {
  id: number;
  requestCode: string;
  sourceType: string;
  contactName: string;
  contactPhone: string;
  address: string;
  wasteType: string;
  estimatedWeightKg: string | null;
  notes: string | null;
  status: string;
  scheduledDate: string | null;
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  source: string;
  used: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export interface ReferralInfo {
  referralCode: string;
  totalReferrals: number;
  coupons: Coupon[];
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${getBaseUrl()}${path}`, {
    headers: { "Content-Type": "application/json", ...((opts.headers as Record<string, string>) ?? {}) },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  products: {
    list: () => req<Product[]>("/api/products"),
    get: (id: number) => req<Product>(`/api/products/${id}`),
  },
  orders: {
    createCart: (data: Record<string, unknown>) =>
      req<{ id: number; trackingNumber: string }>("/api/orders/cart", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    track: (trackingNumber: string) =>
      req<CustomerOrder & { customerName?: string }>(`/api/orders/track/${encodeURIComponent(trackingNumber)}`),
  },
  customer: {
    register: (data: Record<string, unknown>) =>
      req<{ token: string; id: number; name: string; email: string; phone: string; welcomeCode?: string }>(
        "/api/customer/register",
        { method: "POST", body: JSON.stringify(data) }
      ),
    login: (data: Record<string, unknown>) =>
      req<{ token: string; id: number; name: string; email: string; phone: string }>(
        "/api/customer/login",
        { method: "POST", body: JSON.stringify(data) }
      ),
    logout: (token: string) =>
      req<{ ok: boolean }>("/api/customer/logout", {
        method: "POST",
        headers: { "x-customer-token": token },
      }),
    me: (token: string) =>
      req<Customer>("/api/customer/me", {
        headers: { "x-customer-token": token },
      }),
    orders: (token: string) =>
      req<CustomerOrder[]>("/api/customer/orders", {
        headers: { "x-customer-token": token },
      }),
    referral: (token: string) =>
      req<ReferralInfo>("/api/customer/referral", {
        headers: { "x-customer-token": token },
      }),
  },
  discount: {
    validate: (code: string) =>
      req<{ id: number; code: string; discountPercent: number; source: string }>(
        `/api/discount/validate?code=${encodeURIComponent(code)}`
      ),
  },
  wasteCollections: {
    create: (data: Record<string, unknown>) =>
      req<WasteCollection>("/api/waste-collections", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    track: (code: string) =>
      req<WasteCollection>(`/api/waste-collections/${encodeURIComponent(code)}`),
  },
};
