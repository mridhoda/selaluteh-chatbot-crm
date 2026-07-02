export type OrderStatus = 'Incoming' | 'Preparing' | 'Ready' | 'Completed';
export type PaymentStatus = 'Paid' | 'Pending';
export type ChannelType = 'WhatsApp' | 'Telegram' | 'Instagram' | 'Website';

export interface Order {
  id: string;
  orderNo: string;
  outlet: string;
  channel: ChannelType;
  amount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  timestamp: string; // e.g., "9:41 AM"
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
}

export interface OutletStats {
  id: string;
  name: string;
  sales: number;
  change: number; // e.g., 18.2 (for +18.2%)
  orderCount: number;
}

export interface ChannelStats {
  name: ChannelType;
  orders: number;
  sales: number;
  cvr: number; // Conversion rate e.g. 18.9
}

export interface Activity {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  type: 'order' | 'payment' | 'chat' | 'system' | 'broadcast';
  statusLabel?: string;
  statusType?: 'success' | 'warning' | 'info' | 'neutral' | 'danger';
}

export interface DashboardMetrics {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  totalCustomers: number;
  activeConversations: number;
  conversionRate: number;
}
