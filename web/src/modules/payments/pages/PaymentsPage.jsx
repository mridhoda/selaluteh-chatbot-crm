import { useMemo, useState, useEffect } from "react";
import api from "../../../shared/api/httpClient";
import { isDemoMode } from "../../../mocks/demoState";
import "../styles/payments.css";
import {
  User,
  CreditCard,
  Link2,
  FileText,
  Clock,
  Scale,
  X,
  MessageSquare,
  Phone,
  ExternalLink,
  Copy,
  RefreshCw,
  CheckCircle2,
  Download,
  Store,
  Calendar,
  Wallet,
  CheckCircle,
  ChevronDown,
  Columns,
  Search,
} from "lucide-react";
import BrandIcon from "../../../shared/components/brand/BrandIcon";

const PAYMENT_STATUS = {
  paid: {
    label: "Paid",
    className: "payment-badge payment-badge--paid",
  },
  pending: {
    label: "Pending",
    className: "payment-badge payment-badge--pending",
  },
  failed: {
    label: "Failed",
    className: "payment-badge payment-badge--failed",
  },
  expired: {
    label: "Expired",
    className: "payment-badge payment-badge--expired",
  },
  refunded: {
    label: "Refunded",
    className: "payment-badge payment-badge--refunded",
  },
};

const RECONCILIATION_STATUS = {
  matched: {
    label: "Matched",
    className: "reconciliation-badge reconciliation-badge--matched",
  },
  missing_webhook: {
    label: "Missing Webhook",
    className: "reconciliation-badge reconciliation-badge--warning",
  },
  unmatched: {
    label: "Unmatched",
    className: "reconciliation-badge reconciliation-badge--danger",
  },
  amount_mismatch: {
    label: "Amount Mismatch",
    className: "reconciliation-badge reconciliation-badge--warning",
  },
  pending: {
    label: "Pending Check",
    className: "reconciliation-badge reconciliation-badge--neutral",
  },
};

const summaryCards = [
  {
    label: "Gross Collected",
    value: "Rp 8.240.000",
    change: "18%",
    changeType: "positive",
    icon: "wallet",
    tone: "green",
  },
  {
    label: "Pending",
    value: "12",
    change: "6%",
    changeType: "positive",
    icon: "clock",
    tone: "orange",
  },
  {
    label: "Failed / Expired",
    value: "5",
    change: "3%",
    changeType: "negative",
    icon: "close",
    tone: "pink",
  },
  {
    label: "Needs Reconciliation",
    value: "3",
    change: "2%",
    changeType: "positive",
    icon: "warning",
    tone: "orange",
  },
  {
    label: "Provider Fees",
    value: "Rp 152.000",
    change: "5%",
    changeType: "positive",
    icon: "tag",
    tone: "purple",
  },
  {
    label: "Net Received",
    value: "Rp 8.088.000",
    change: "16%",
    changeType: "positive",
    icon: "bank",
    tone: "green",
  },
];

const initialPayments = [
  {
    id: "PAY-2048",
    orderId: "ORD-1028",
    customer: {
      name: "Rina Pratiwi",
      phone: "0812-3456-7890",
    },
    outlet: "Samarinda",
    outletInitial: "S",
    channel: "WhatsApp",
    provider: "Midtrans",
    method: "QRIS",
    grossAmount: 38000,
    providerFee: 266,
    netAmount: 37734,
    paymentStatus: "paid",
    reconciliationStatus: "matched",
    updatedTime: "06:23 PM",
    updatedDate: "16 May 2025",
    providerTransactionId: "QRIS-829172",
    merchantReference: "ORD-1028-PAY-03",
    paymentUrl: "https://example.com/payment/PAY-2048",
    expiresAt: "16 May 2025, 07:21 PM",
    paidAt: "16 May 2025, 06:23 PM",
    matchedAt: "16 May 2025, 06:23 PM",
    attempts: [
      {
        number: 1,
        status: "expired",
        method: "QRIS",
        createdAt: "16 May 2025, 05:51 PM",
      },
      {
        number: 2,
        status: "paid",
        method: "QRIS",
        createdAt: "16 May 2025, 06:20 PM",
      },
    ],
    events: [
      {
        time: "10:21 AM",
        label: "Payment link created",
        type: "success",
      },
      {
        time: "10:23 AM",
        label: "Webhook received",
        type: "success",
      },
      {
        time: "10:23 AM",
        label: "Signature verified",
        type: "success",
      },
      {
        time: "10:24 AM",
        label: "Payment marked paid",
        type: "success",
      },
      {
        time: "10:24 AM",
        label: "Order updated",
        type: "success",
      },
      {
        time: "10:25 AM",
        label: "Telegram notification sent",
        type: "success",
      },
    ],
  },
  {
    id: "PAY-2047",
    orderId: "ORD-1027",
    customer: {
      name: "Dewi Lestari",
      phone: "0813-2545-6789",
    },
    outlet: "Tenggarong",
    outletInitial: "T",
    channel: "Telegram",
    provider: "Midtrans",
    method: "VA BCA",
    grossAmount: 52000,
    providerFee: 420,
    netAmount: 51580,
    paymentStatus: "pending",
    reconciliationStatus: "missing_webhook",
    updatedTime: "06:19 PM",
    updatedDate: "16 May 2025",
    providerTransactionId: "BCA-991720",
    merchantReference: "ORD-1027-PAY-01",
    paymentUrl: "https://example.com/payment/PAY-2047",
    expiresAt: "16 May 2025, 08:19 PM",
    paidAt: null,
    matchedAt: null,
    attempts: [
      {
        number: 1,
        status: "pending",
        method: "VA BCA",
        createdAt: "16 May 2025, 06:18 PM",
      },
    ],
    events: [
      {
        time: "06:18 PM",
        label: "Payment link created",
        type: "success",
      },
      {
        time: "06:19 PM",
        label: "Provider request accepted",
        type: "success",
      },
      {
        time: "06:20 PM",
        label: "Waiting for webhook",
        type: "warning",
      },
    ],
  },
  {
    id: "PAY-2046",
    orderId: "ORD-1026",
    customer: {
      name: "Andi Wijaya",
      phone: "0811-2233-4455",
    },
    outlet: "Bontang",
    outletInitial: "B",
    channel: "WhatsApp",
    provider: "Xendit",
    method: "QRIS",
    grossAmount: 24000,
    providerFee: 168,
    netAmount: 23832,
    paymentStatus: "expired",
    reconciliationStatus: "unmatched",
    updatedTime: "06:12 PM",
    updatedDate: "16 May 2025",
    providerTransactionId: "XND-773012",
    merchantReference: "ORD-1026-PAY-01",
    paymentUrl: "https://example.com/payment/PAY-2046",
    expiresAt: "16 May 2025, 06:12 PM",
    paidAt: null,
    matchedAt: null,
    attempts: [
      {
        number: 1,
        status: "expired",
        method: "QRIS",
        createdAt: "16 May 2025, 05:12 PM",
      },
    ],
    events: [
      {
        time: "05:12 PM",
        label: "Payment link created",
        type: "success",
      },
      {
        time: "06:12 PM",
        label: "Payment link expired",
        type: "danger",
      },
      {
        time: "06:13 PM",
        label: "Reconciliation required",
        type: "warning",
      },
    ],
  },
  {
    id: "PAY-2045",
    orderId: "ORD-1025",
    customer: {
      name: "Siti Aminah",
      phone: "0812-9988-7766",
    },
    outlet: "Samarinda",
    outletInitial: "S",
    channel: "Website",
    provider: "Midtrans",
    method: "GoPay",
    grossAmount: 76000,
    providerFee: 650,
    netAmount: 75350,
    paymentStatus: "paid",
    reconciliationStatus: "matched",
    updatedTime: "06:08 PM",
    updatedDate: "16 May 2025",
    providerTransactionId: "GOPAY-317801",
    merchantReference: "ORD-1025-PAY-01",
    paymentUrl: "https://example.com/payment/PAY-2045",
    expiresAt: "16 May 2025, 07:02 PM",
    paidAt: "16 May 2025, 06:08 PM",
    matchedAt: "16 May 2025, 06:08 PM",
    attempts: [
      {
        number: 1,
        status: "paid",
        method: "GoPay",
        createdAt: "16 May 2025, 06:02 PM",
      },
    ],
    events: [
      {
        time: "06:02 PM",
        label: "Payment link created",
        type: "success",
      },
      {
        time: "06:07 PM",
        label: "Webhook received",
        type: "success",
      },
      {
        time: "06:08 PM",
        label: "Payment marked paid",
        type: "success",
      },
    ],
  },
  {
    id: "PAY-2044",
    orderId: "ORD-1024",
    customer: {
      name: "Budi Santoso",
      phone: "0852-6677-8899",
    },
    outlet: "Balikpapan",
    outletInitial: "B",
    channel: "WhatsApp",
    provider: "Midtrans",
    method: "QRIS",
    grossAmount: 31000,
    providerFee: 217,
    netAmount: 30783,
    paymentStatus: "failed",
    reconciliationStatus: "amount_mismatch",
    updatedTime: "05:58 PM",
    updatedDate: "16 May 2025",
    providerTransactionId: "QRIS-582190",
    merchantReference: "ORD-1024-PAY-02",
    paymentUrl: "https://example.com/payment/PAY-2044",
    expiresAt: "16 May 2025, 06:58 PM",
    paidAt: null,
    matchedAt: null,
    attempts: [
      {
        number: 1,
        status: "failed",
        method: "QRIS",
        createdAt: "16 May 2025, 05:54 PM",
      },
      {
        number: 2,
        status: "failed",
        method: "QRIS",
        createdAt: "16 May 2025, 05:57 PM",
      },
    ],
    events: [
      {
        time: "05:54 PM",
        label: "Payment link created",
        type: "success",
      },
      {
        time: "05:57 PM",
        label: "Webhook received",
        type: "success",
      },
      {
        time: "05:58 PM",
        label: "Amount mismatch detected",
        type: "danger",
      },
    ],
  },
];

const tabOptions = [
  {
    id: "all",
    label: "All Payments",
  },
  {
    id: "attention",
    label: "Needs Attention",
  },
  {
    id: "pending",
    label: "Pending",
  },
  {
    id: "paid",
    label: "Paid",
  },
  {
    id: "failed",
    label: "Failed & Expired",
  },
  {
    id: "refunded",
    label: "Refunds",
  },
];

const filterOptions = {
  outlet: [
    { value: "all", label: "All Outlets" },
    { value: "samarinda", label: "Samarinda" },
    { value: "tenggarong", label: "Tenggarong" },
    { value: "bontang", label: "Bontang" },
    { value: "balikpapan", label: "Balikpapan" },
  ],
  dateRange: [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "seven-days", label: "Last 7 Days" },
    { value: "thirty-days", label: "Last 30 Days" },
  ],
  provider: [
    { value: "all", label: "All Providers" },
    { value: "midtrans", label: "Midtrans" },
    { value: "xendit", label: "Xendit" },
  ],
  method: [
    { value: "all", label: "All Methods" },
    { value: "qris", label: "QRIS" },
    { value: "va bca", label: "VA BCA" },
    { value: "gopay", label: "GoPay" },
  ],
  reconciliation: [
    { value: "all", label: "All Status" },
    { value: "matched", label: "Matched" },
    { value: "missing_webhook", label: "Missing Webhook" },
    { value: "unmatched", label: "Unmatched" },
    { value: "amount_mismatch", label: "Amount Mismatch" },
  ],
};

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function SummaryIcon({ type }) {
  const icons = {
    wallet: "🛍️",
    clock: "⏱️",
    close: "❌",
    warning: "⚠️",
    tag: "🏷️",
    bank: "🏦",
  };

  return <span aria-hidden="true">{icons[type] ?? "•"}</span>;
}

function PaymentsFilterSelect({ label, icon: Icon, value, options, onChange, defaultValue = "all", className = "" }) {
  const selectedLabel = options.find((option) => option.value === value)?.label || options[0]?.label;
  const isApplied = value !== defaultValue;

  return (
    <label
      className={`relative flex h-[54px] min-w-0 flex-col justify-center rounded-xl border px-3 text-left transition focus-within:border-[var(--brand-500)] focus-within:shadow-[0_0_0_3px_var(--focus-brand-ring)] ${
        isApplied
          ? "border-[var(--brand-400)] bg-[var(--brand-50)]"
          : "border-[var(--border-subtle)] bg-[var(--surface-primary)] hover:border-[var(--border-default)] hover:bg-[var(--surface-secondary)]"
      } ${className}`}
    >
      <span className={`mb-1 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${isApplied ? "text-[var(--brand-600)]" : "text-[var(--text-muted)]"}`}>
        {label}
      </span>
      <span className="pointer-events-none flex min-w-0 items-center gap-2 pr-5 text-xs font-bold text-[var(--text-primary)]">
        {Icon && <Icon className={`shrink-0 w-3.5 h-3.5 ${isApplied ? "text-[var(--brand-500)]" : "text-[var(--text-subtle)]"}`} />}
        <span className="truncate whitespace-nowrap">{selectedLabel}</span>
      </span>
      <ChevronDown
        className="pointer-events-none absolute bottom-3.5 right-3 w-3 h-3 text-[var(--text-subtle)]"
      />
      <select
        aria-label={label}
        value={value}
        onChange={onChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 focus-visible:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function PaymentStatusBadge({ status }) {
  const styles = {
    paid: "bg-[var(--success-50)] text-[var(--success-600)] border border-[var(--success-100)]",
    pending: "bg-[var(--warning-50)] text-[var(--warning-600)] border border-[var(--warning-200)]",
    failed: "bg-[var(--danger-50)] text-[var(--danger-600)] border border-[var(--danger-100)]",
    expired: "bg-gray-50 text-gray-600 border border-gray-200",
    refunded: "bg-[var(--info-50)] text-[var(--info-600)] border border-[var(--info-200)]",
  };

  const labels = {
    paid: "Paid",
    pending: "Pending",
    failed: "Failed",
    expired: "Expired",
    refunded: "Refunded",
  };

  const s = status ? status.toLowerCase() : "pending";
  const styleClass = styles[s] || styles.pending;
  const label = labels[s] || status;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${styleClass}`}>
      <span className="text-[6px]">●</span> {label}
    </span>
  );
}

function ReconciliationBadge({ status }) {
  const styles = {
    matched: "bg-[var(--success-50)] text-[var(--success-600)] border border-[var(--success-100)]",
    missing_webhook: "bg-[var(--warning-50)] text-[var(--warning-600)] border border-[var(--warning-200)]",
    unmatched: "bg-[var(--danger-50)] text-[var(--danger-600)] border border-[var(--danger-100)]",
    amount_mismatch: "bg-[var(--warning-50)] text-[var(--warning-600)] border border-[var(--warning-200)]",
    pending: "bg-gray-50 text-gray-600 border border-gray-200",
  };

  const labels = {
    matched: "Matched",
    missing_webhook: "Missing Webhook",
    unmatched: "Unmatched",
    amount_mismatch: "Amount Mismatch",
    pending: "Pending Check",
  };

  const s = status ? status.toLowerCase() : "pending";
  const styleClass = styles[s] || styles.pending;
  const label = labels[s] || status;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${styleClass}`}>
      <span className="text-[6px]">●</span> {label}
    </span>
  );
}

function PaymentProviderIcon({ provider }) {
  if (provider === "Midtrans") {
    return (
      <span className="flex items-center justify-center w-5 h-5 rounded bg-blue-50 text-blue-600 font-bold text-[10px]" aria-hidden="true">
        M
      </span>
    );
  }
  return (
    <span className="flex items-center justify-center w-5 h-5 rounded bg-indigo-50 text-indigo-600 font-bold text-[10px]" aria-hidden="true">
      X
    </span>
  );
}

function PaymentDetailDrawer({
  payment,
  onClose,
  onOpenOrder,
  onOpenChat,
  onCopyLink,
  onRetrySync,
}) {
  if (!payment) {
    return (
      <aside className="fixed inset-y-0 right-0 z-[80] w-full md:w-[400px] h-[100dvh] bg-[var(--surface-primary)] border-l border-[var(--border-subtle)] overflow-hidden flex flex-col shrink-0 items-center justify-center text-center p-6 text-[var(--text-muted)] shadow-[-4px_0_15px_rgba(17,24,46,0.03)]">
        <div className="absolute top-4 right-4">
          <button
            className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[#F43F70] hover:border-[#F43F70] hover:bg-[#FFF5F7] cursor-pointer transition-colors duration-150 outline-none focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]"
            onClick={onClose}
            aria-label="Close payment detail"
          >
            <X size={15} />
          </button>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-subtle)] mb-2 border border-dashed border-[var(--border-subtle)] text-lg">
            💳
          </div>
          <div className="text-sm font-semibold text-[var(--text-muted)]">No Payment Selected</div>
          <div className="text-xs text-[var(--text-muted)] max-w-[240px]">
            Click on any payment in the table to view its full details here.
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-[80] w-full md:w-[400px] h-[100dvh] bg-[var(--surface-primary)] border-l border-[var(--border-subtle)] overflow-hidden flex flex-col shrink-0 shadow-[-4px_0_15px_rgba(17,24,46,0.03)] animate-in slide-in-from-right duration-150">
      {/* Header Panel */}
      <header className="shrink-0 sticky top-0 z-10 px-5 pt-4 pb-3 border-b border-[var(--brand-100)] bg-[image:var(--orders-sidebar-header-bg)]">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[var(--text-primary)] m-0">Payment #{payment.id}</h2>
            <PaymentStatusBadge status={payment.paymentStatus} />
          </div>

          <button
            className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[#F43F70] hover:border-[#F43F70] hover:bg-[#FFF5F7] cursor-pointer transition-colors duration-150 outline-none focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]"
            onClick={onClose}
            aria-label="Close payment detail"
          >
            <X size={15} />
          </button>
        </div>

        <button
          type="button"
          className="text-xs font-bold text-[#F43F70] hover:underline mb-3 block text-left bg-transparent border-0 p-0 cursor-pointer"
          onClick={() => onOpenOrder(payment)}
        >
          Order #{payment.orderId}
        </button>

        <div className="flex justify-between items-center text-sm font-medium text-[var(--text-secondary)]">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold">
              {payment.outletInitial}
            </span>
            <span>{payment.outlet}</span>
          </div>
          <div className="flex items-center gap-2">
            <BrandIcon type={payment.channel.toLowerCase()} size={14} />
            <span className="capitalize">{payment.channel}</span>
          </div>
        </div>
      </header>

      {/* Scrollable body */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4">
        {/* Customer Block */}
        <div>
          <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-3">
            <User size={13} className="text-[var(--text-muted)] shrink-0" />
            <span>Customer</span>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-[var(--text-primary)] text-sm leading-tight">{payment.customer.name}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1 leading-none">{payment.customer.phone}</div>
            </div>

            <div className="flex gap-2">
              <button
                aria-label="Open customer chat"
                onClick={() => onOpenChat(payment)}
                className="w-8 h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-primary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[#F43F70] hover:border-[#F43F70] hover:bg-[#FFF5F7] cursor-pointer transition-all duration-150 outline-none focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]"
              >
                <MessageSquare size={13} />
              </button>

              <button
                aria-label="Call customer"
                className="w-8 h-8 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-primary)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[#F43F70] hover:border-[#F43F70] hover:bg-[#FFF5F7] cursor-pointer transition-all duration-150 outline-none focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]"
              >
                <Phone size={13} />
              </button>
            </div>
          </div>
        </div>

        <hr className="border-[var(--border-default)]" style={{ margin: "8px 0" }} />

        {/* Amounts Block */}
        <div>
          <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-3">
            <CreditCard size={13} className="text-[var(--text-muted)] shrink-0" />
            <span>Amounts</span>
          </div>

          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)] font-medium">Gross Amount</span>
              <span className="font-semibold text-[var(--text-primary)]">{formatRupiah(payment.grossAmount)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)] font-medium">Provider Fee</span>
              <span className="font-semibold text-[var(--text-primary)]">{formatRupiah(payment.providerFee)}</span>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-between items-center mt-1">
              <span className="font-bold text-[var(--text-primary)]">Net Amount</span>
              <span className="font-extrabold text-emerald-600 text-sm">{formatRupiah(payment.netAmount)}</span>
            </div>
          </div>
        </div>

        <hr className="border-[var(--border-default)]" style={{ margin: "8px 0" }} />

        {/* Provider Details Block */}
        <div>
          <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-3">
            <FileText size={13} className="text-[var(--text-muted)] shrink-0" />
            <span>Provider Details</span>
          </div>

          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)] font-medium">Provider</span>
              <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <PaymentProviderIcon provider={payment.provider} />
                {payment.provider}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)] font-medium">Method</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-600 capitalize">
                {payment.method}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)] font-medium">Provider ID</span>
              <span className="font-semibold text-[var(--text-primary)] truncate max-w-[180px]">{payment.providerTransactionId}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)] font-medium">Merchant Ref</span>
              <span className="font-semibold text-[var(--text-primary)]">{payment.merchantReference}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)] font-medium">Expires At</span>
              <span className="font-semibold text-[var(--text-primary)]">{payment.expiresAt}</span>
            </div>

            {payment.paidAt ? (
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] font-medium">Paid At</span>
                <span className="font-semibold text-[var(--text-primary)]">{payment.paidAt}</span>
              </div>
            ) : null}
          </div>
        </div>

        <hr className="border-[var(--border-default)]" style={{ margin: "8px 0" }} />

        {/* Link & Attempts Block */}
        <div>
          <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-3">
            <Link2 size={13} className="text-[var(--text-muted)] shrink-0" />
            <span>Link & Attempts</span>
          </div>

          <div className="space-y-3">
            {payment.attempts.map((attempt) => (
              <div
                className="flex justify-between items-center pb-2 border-b border-gray-50 last:border-0 last:pb-0"
                key={`${payment.id}-${attempt.number}`}
              >
                <div>
                  <strong className="text-[var(--text-primary)] text-xs font-bold">Link #{attempt.number}</strong>
                  <span className="block text-[10px] text-[var(--text-muted)] mt-0.5">
                    {attempt.method} · {attempt.createdAt}
                  </span>
                </div>

                <PaymentStatusBadge status={attempt.status} />
              </div>
            ))}
          </div>
        </div>

        <hr className="border-[var(--border-default)]" style={{ margin: "8px 0" }} />

        {/* Reconciliation Block */}
        <div>
          <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-3">
            <Scale size={13} className="text-[var(--text-muted)] shrink-0" />
            <span>Reconciliation</span>
          </div>

          <div className="space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)] font-medium">Status</span>
              <ReconciliationBadge status={payment.reconciliationStatus} />
            </div>

            {payment.matchedAt ? (
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)] font-medium">Matched At</span>
                <span className="font-semibold text-[var(--text-primary)]">{payment.matchedAt}</span>
              </div>
            ) : null}
          </div>
        </div>

        <hr className="border-[var(--border-default)]" style={{ margin: "8px 0" }} />

        {/* Event Timeline Block */}
        <div>
          <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-2 mb-3">
            <Clock size={13} className="text-[var(--text-muted)] shrink-0" />
            <span>Event Timeline</span>
          </div>

          <div className="relative pl-1">
            {/* Timeline vertical connector path */}
            <div className="absolute left-[11px] top-2 bottom-2 w-[1.5px] bg-[#10b981] opacity-60 z-0" />

            <ol className="space-y-4 list-none p-0 m-0">
              {payment.events.map((event, index) => (
                <li
                  key={`${event.time}-${event.label}-${index}`}
                  className="relative flex items-center gap-3 text-xs text-[var(--text-secondary)] m-0"
                >
                  <div className="relative z-10 w-6 h-6 rounded-full bg-white flex items-center justify-center text-[#16A34A] border border-gray-100 shrink-0 shadow-sm">
                    <CheckCircle2 size={13} className="text-[#10b981]" />
                  </div>

                  <time className="font-semibold text-[var(--text-muted)] w-14 shrink-0">{event.time}</time>

                  <span className="font-medium text-[var(--text-primary)] truncate">{event.label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Quick Actions Footer */}
      <footer className="shrink-0 sticky bottom-0 bg-[var(--surface-primary)] border-t border-[var(--border-subtle)] px-5 py-4 flex flex-col gap-3">
        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Quick Actions</span>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onOpenOrder(payment)}
            className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:border-[var(--border-default)] hover:text-[var(--brand-600)] transition-all duration-150 shadow-sm cursor-pointer outline-none focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]"
          >
            <ExternalLink size={13} />
            Open Order
          </button>

          <button
            onClick={() => onOpenChat(payment)}
            className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:border-[var(--border-default)] hover:text-[var(--brand-600)] transition-all duration-150 shadow-sm cursor-pointer outline-none focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]"
          >
            <MessageSquare size={13} />
            Open Chat
          </button>

          {payment.paymentUrl ? (
            <button
              onClick={() => onCopyLink(payment)}
              className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:border-[var(--border-default)] hover:text-[var(--brand-600)] transition-all duration-150 shadow-sm cursor-pointer outline-none focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]"
            >
              <Copy size={13} />
              Copy Link
            </button>
          ) : null}

          <button
            onClick={() => onRetrySync(payment)}
            className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] flex items-center justify-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:border-[var(--border-default)] hover:text-[var(--brand-600)] transition-all duration-150 shadow-sm cursor-pointer outline-none focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]"
          >
            <RefreshCw size={13} />
            Retry Sync
          </button>
        </div>
      </footer>
    </aside>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    try {
      if (isDemoMode()) {
        setPayments(initialPayments);
      } else {
        const res = await api.get('/payments');
        const rawPayments = Array.isArray(res.data) 
          ? res.data 
          : (res.data && Array.isArray(res.data.data) ? res.data.data : []);
        
        const mappedPayments = rawPayments.map((p, idx) => ({
          id: p.id || p._id,
          _id: p.id || p._id,
          orderId: p.order_id || p.orderId || '-',
          outlet: p.outlet_id || 'Samarinda',
          provider: p.provider || 'xendit',
          paymentMethod: p.payment_method || 'Virtual Account',
          amount: p.amount || p.total_amount || 0,
          paymentStatus: p.payment_status || p.status || 'Pending',
          reconciliationStatus: p.reconciliation_status || 'Reconciled',
          createdAt: p.created_at || new Date().toISOString(),
          customer: {
            name: p.customer_name_snapshot || 'Unknown User',
            phone: p.customer_phone_snapshot || '-',
          },
          events: p.events || []
        }));
        setPayments(mappedPayments);
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (payments.length > 0 && !selectedPaymentId) {
      setSelectedPaymentId(payments[0].id);
    }
  }, [payments]);

  const [search, setSearch] = useState("");
  const [outlet, setOutlet] = useState("all");
  const [provider, setProvider] = useState("all");
  const [method, setMethod] = useState("all");
  const [reconciliation, setReconciliation] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);

  const currentSelectedPayment = useMemo(() => {
    return payments.find((p) => p.id === selectedPaymentId);
  }, [payments, selectedPaymentId]);

  const filteredPayments = useMemo(() => {
    return payments.filter((payment) => {
      const keyword = search.trim().toLowerCase();

      const matchesSearch =
        !keyword ||
        payment.id.toLowerCase().includes(keyword) ||
        payment.orderId.toLowerCase().includes(keyword) ||
        payment.customer.name.toLowerCase().includes(keyword) ||
        payment.customer.phone.toLowerCase().includes(keyword) ||
        payment.providerTransactionId.toLowerCase().includes(keyword);

      const matchesOutlet =
        outlet === "all" ||
        payment.outlet.toLowerCase() === outlet.toLowerCase();

      const matchesProvider =
        provider === "all" ||
        payment.provider.toLowerCase() === provider.toLowerCase();

      const matchesMethod =
        method === "all" ||
        payment.method.toLowerCase() === method.toLowerCase();

      const matchesReconciliation =
        reconciliation === "all" ||
        payment.reconciliationStatus === reconciliation;

      let matchesTab = true;

      if (activeTab === "attention") {
        matchesTab =
          payment.reconciliationStatus !== "matched" ||
          ["failed", "expired"].includes(payment.paymentStatus);
      }

      if (activeTab === "pending") {
        matchesTab = payment.paymentStatus === "pending";
      }

      if (activeTab === "paid") {
        matchesTab = payment.paymentStatus === "paid";
      }

      if (activeTab === "failed") {
        matchesTab = ["failed", "expired"].includes(
          payment.paymentStatus
        );
      }

      if (activeTab === "refunded") {
        matchesTab = payment.paymentStatus === "refunded";
      }

      return (
        matchesSearch &&
        matchesOutlet &&
        matchesProvider &&
        matchesMethod &&
        matchesReconciliation &&
        matchesTab
      );
    });
  }, [
    payments,
    search,
    outlet,
    provider,
    method,
    reconciliation,
    activeTab,
  ]);

  function getTabCount(tabId) {
    if (tabId === "all") {
      return payments.length;
    }

    if (tabId === "attention") {
      return payments.filter(
        (payment) =>
          payment.reconciliationStatus !== "matched" ||
          ["failed", "expired"].includes(payment.paymentStatus)
      ).length;
    }

    if (tabId === "pending") {
      return payments.filter(
        (payment) => payment.paymentStatus === "pending"
      ).length;
    }

    if (tabId === "paid") {
      return payments.filter(
        (payment) => payment.paymentStatus === "paid"
      ).length;
    }

    if (tabId === "failed") {
      return payments.filter((payment) =>
        ["failed", "expired"].includes(payment.paymentStatus)
      ).length;
    }

    return payments.filter(
      (payment) => payment.paymentStatus === "refunded"
    ).length;
  }

  async function handleCopyLink(payment) {
    try {
      await navigator.clipboard.writeText(payment.paymentUrl);
      window.alert("Payment link copied.");
    } catch {
      window.alert("Unable to copy payment link.");
    }
  }

  function handleExport() {
    console.log("Export filtered payments", filteredPayments);
  }

  function handleSyncProvider() {
    console.log("Sync payment provider");
  }

  function handleRetrySync(payment) {
    console.log("Retry provider sync", payment.id);
  }

  function handleOpenOrder(payment) {
    console.log("Open order", payment.orderId);
  }

  function handleOpenChat(payment) {
    console.log("Open customer chat", payment.customer);
  }

  const clearAllFilters = () => {
    setOutlet("all");
    setDateRange("today");
    setProvider("all");
    setMethod("all");
    setReconciliation("all");
    setSearch("");
  };

  const hasActiveFilters =
    outlet !== "all" ||
    dateRange !== "today" ||
    provider !== "all" ||
    method !== "all" ||
    reconciliation !== "all" ||
    search !== "";

  return (
    <div className="flex flex-1 overflow-hidden bg-[var(--app-background)] -m-4 h-[calc(100vh-58px)] max-h-[calc(100vh-58px)]">
      <div
        className={`flex-1 flex flex-col min-w-0 p-4 pt-3 overflow-hidden transition-[padding] duration-200 motion-reduce:transition-none ${
          isDetailOpen ? "md:pr-[416px]" : "md:pr-4"
        }`}
      >
        {/* Toolbar Header (Title, Subtitle, Actions, Filters) */}
        <div className="mb-2.5 flex shrink-0 flex-col">
          <div className="mb-3 flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
            <div className="flex flex-col">
              <div className="text-2xl font-bold leading-tight text-[var(--text-primary)]">Payments</div>
              <div className="mt-1 text-xs leading-tight text-[var(--text-muted)]">
                Monitor payment attempts, provider events, fees, and reconciliation across all outlets.
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 xl:flex-nowrap">
              <button
                onClick={handleExport}
                className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition duration-200 hover:border-[var(--border-default)] hover:bg-[var(--surface-secondary)] focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Export</span>
              </button>

              <button
                onClick={handleSyncProvider}
                className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition duration-200 hover:border-[var(--border-default)] hover:bg-[var(--surface-secondary)] focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <span>Sync Provider</span>
              </button>

              <div className="flex shrink-0 items-center text-xs font-medium text-[var(--text-muted)] xl:border-l xl:border-[var(--border-subtle)] xl:pl-3">
                <span>Last updated: 01:44:40 PM</span>
              </div>

              <button
                onClick={handleSyncProvider}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] text-[var(--text-muted)] transition duration-150 hover:border-[var(--border-default)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-secondary)] focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] cursor-pointer"
                title="Refresh payments"
                aria-label="Refresh payments"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {!isDetailOpen && currentSelectedPayment && (
                <button
                  type="button"
                  onClick={() => setIsDetailOpen(true)}
                  className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3 text-xs font-bold text-[var(--text-secondary)] transition duration-150 hover:border-[var(--brand-200)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-600)] focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] cursor-pointer"
                  title="Show payment details"
                  aria-label={`Show payment details for ${currentSelectedPayment.id}`}
                >
                  <Columns className="w-4 h-4 text-[var(--text-muted)]" />
                  <span className="truncate">{currentSelectedPayment.id}</span>
                </button>
              )}
            </div>
          </div>

          <div className="mb-2.5 flex flex-wrap gap-2.5 items-stretch">
            <PaymentsFilterSelect
              label="Outlet"
              icon={Store}
              value={outlet}
              options={filterOptions.outlet}
              onChange={(e) => setOutlet(e.target.value)}
              className="flex-1 min-w-[120px]"
            />

            <PaymentsFilterSelect
              label="Date Range"
              icon={Calendar}
              value={dateRange}
              options={filterOptions.dateRange}
              defaultValue="today"
              onChange={(e) => setDateRange(e.target.value)}
              className="flex-1 min-w-[120px]"
            />

            <PaymentsFilterSelect
              label="Provider"
              icon={Store}
              value={provider}
              options={filterOptions.provider}
              onChange={(e) => setProvider(e.target.value)}
              className="flex-1 min-w-[120px]"
            />

            <PaymentsFilterSelect
              label="Method"
              icon={Wallet}
              value={method}
              options={filterOptions.method}
              onChange={(e) => setMethod(e.target.value)}
              className="flex-1 min-w-[120px]"
            />

            <PaymentsFilterSelect
              label="Reconciliation"
              icon={CheckCircle}
              value={reconciliation}
              options={filterOptions.reconciliation}
              onChange={(e) => setReconciliation(e.target.value)}
              className="flex-1 min-w-[120px]"
            />

            <div className="relative flex h-[54px] min-w-[200px] flex-1 items-center">
              <input
                type="text"
                placeholder="Search payment ID, order ID, customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-full w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] pl-10 pr-3 text-xs font-medium text-[var(--text-primary)] transition placeholder:text-[var(--text-subtle)] hover:border-[var(--border-default)] focus:border-[var(--brand-500)] focus:outline-none focus:shadow-[0_0_0_3px_var(--focus-brand-ring)]"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--text-subtle)]">
                <Search className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Showing Active Filters Status Bar */}
          <div className="rounded-lg border border-[var(--brand-100)] bg-[var(--brand-50)] px-4 py-2.5 flex items-center justify-between text-xs text-[var(--text-secondary)] shrink-0 font-medium gap-3">
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              <span>Showing:</span>
              <span className="text-[var(--text-primary)] font-bold capitalize">
                {outlet === "all" ? "All Outlets" : outlet}
              </span>
              <span className="text-[var(--brand-400)]">·</span>
              <span>Date:</span>
              <span className="text-[var(--text-primary)] font-bold capitalize">
                {dateRange === "today" ? "Today" :
                 dateRange === "yesterday" ? "Yesterday" :
                 dateRange === "seven-days" ? "Last 7 Days" : "Last 30 Days"}
              </span>
              {provider !== "all" && (
                <>
                  <span className="text-[var(--brand-400)]">·</span>
                  <span>Provider:</span>
                  <span className="text-[var(--text-primary)] font-bold capitalize">{provider}</span>
                </>
              )}
              {method !== "all" && (
                <>
                  <span className="text-[var(--brand-400)]">·</span>
                  <span>Method:</span>
                  <span className="text-[var(--text-primary)] font-bold uppercase">{method}</span>
                </>
              )}
              {reconciliation !== "all" && (
                <>
                  <span className="text-[var(--brand-400)]">·</span>
                  <span>Reconciliation:</span>
                  <span className="text-[var(--text-primary)] font-bold capitalize">{reconciliation}</span>
                </>
              )}
              {search && (
                <>
                  <span className="text-[var(--brand-400)]">·</span>
                  <span>Keyword:</span>
                  <span className="text-[var(--text-primary)] font-bold">&ldquo;{search}&rdquo;</span>
                </>
              )}
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="shrink-0 text-[var(--brand-600)] hover:text-[var(--brand-700)] font-bold hover:underline flex items-center gap-1 transition duration-150 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] cursor-pointer bg-transparent border-0"
              >
                <X className="w-3 h-3" />
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Summary Cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3 shrink-0" aria-label="Payment summary">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className="bg-[var(--surface-primary)] px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] shadow-[var(--orders-summary-shadow)] flex items-center gap-2.5"
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${
                card.tone === "green" ? "bg-[var(--success-50)] text-[var(--success-500)]" :
                card.tone === "orange" ? "bg-[var(--warning-50)] text-[var(--warning-500)]" :
                card.tone === "pink" ? "bg-[var(--danger-50)] text-[var(--danger-500)]" :
                "bg-[var(--brand-50)] text-[var(--brand-500)]"
              }`}>
                <SummaryIcon type={card.icon} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[var(--text-muted)] text-[10px] font-semibold truncate leading-none">
                  {card.label}
                </span>
                <h3 className="text-base font-bold text-[var(--text-primary)] leading-tight mt-0.5">
                  {card.value}
                </h3>
                <div className="text-[9px] font-bold mt-0.5 flex items-center gap-1 whitespace-nowrap">
                  <span className={card.changeType === "positive" ? "text-[var(--success-500)]" : "text-[var(--danger-500)]"}>
                    {card.changeType === "positive" ? "▲" : "▼"}{" "}
                    {card.change}
                  </span>
                  <span className="text-[var(--text-muted)] font-normal">vs yesterday</span>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Tabs Row */}
        <div className="mb-3 shrink-0 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-5 py-2.5 shadow-[var(--orders-card-shadow)]">
          <div className="flex min-w-0 items-center gap-7 overflow-x-auto scrollbar-none">
            {tabOptions.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setPage(1);
                  }}
                  className={`flex h-10 appearance-none items-center gap-2.5 rounded-xl border px-4 text-[11px] font-extrabold uppercase tracking-[0.06em] whitespace-nowrap outline-none transition-all duration-200 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] cursor-pointer ${
                    isActive
                      ? "border-[var(--brand-500)] bg-[var(--brand-500)] text-[var(--text-inverse)] shadow-[0_6px_16px_rgba(244,63,112,0.16)] hover:bg-[var(--brand-600)] active:bg-[var(--brand-700)]"
                      : "border-transparent bg-transparent text-[var(--text-secondary)] shadow-none hover:bg-[var(--surface-hover)]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-normal ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-[var(--surface-tertiary)] text-[var(--text-muted)]"
                  }`}>
                    {getTabCount(tab.id)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payments Data Table */}
        <div className="min-h-0 flex-1 overflow-auto bg-white border-x border-b border-gray-200">
          <table className="w-full min-w-[1260px] text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Outlet</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Fee</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Net</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Status</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Reconciliation</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Updated At</th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => {
                  const isSelected = selectedPaymentId === payment.id;
                  return (
                    <tr
                      key={payment.id}
                      className={`hover:bg-slate-50/60 cursor-pointer transition-colors duration-150 ${
                        isSelected ? "bg-[var(--brand-50)] hover:bg-[var(--brand-50)]" : ""
                      }`}
                      onClick={() => {
                        setSelectedPaymentId(payment.id);
                        setIsDetailOpen(true);
                      }}
                    >
                      {/* Payment ID */}
                      <td className={`py-4.5 pr-6 text-sm font-semibold text-gray-800 transition-all duration-150 border-l-4 ${
                        isSelected 
                          ? "border-l-brand-500 pl-5" 
                          : "border-l-transparent pl-5"
                      }`}>
                        {payment.id}
                      </td>

                      {/* Order ID */}
                      <td className="px-6 py-4.5">
                        <button
                          className="border-0 text-sm font-semibold text-gray-700 bg-transparent hover:text-[var(--brand-500)] hover:underline cursor-pointer p-0"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenOrder(payment);
                          }}
                        >
                          {payment.orderId}
                        </button>
                      </td>

                      {/* Customer */}
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800">{payment.customer.name}</span>
                          <span className="text-gray-400 text-xs mt-0.5">{payment.customer.phone}</span>
                        </div>
                      </td>

                      {/* Outlet */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {payment.outletInitial}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{payment.outlet}</span>
                        </div>
                      </td>

                      {/* Provider */}
                      <td className="px-6 py-4.5">
                        <div className="flex items-center gap-2">
                          <PaymentProviderIcon provider={payment.provider} />
                          <span className="text-sm font-medium text-gray-700">{payment.provider}</span>
                        </div>
                      </td>

                      {/* Method */}
                      <td className="px-6 py-4.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-600 capitalize">
                          {payment.method}
                        </span>
                      </td>

                      {/* Gross */}
                      <td className="px-6 py-4.5 text-sm font-bold text-gray-800">
                        {formatRupiah(payment.grossAmount)}
                      </td>

                      {/* Fee */}
                      <td className="px-6 py-4.5 text-sm font-medium text-gray-600">
                        {formatRupiah(payment.providerFee)}
                      </td>

                      {/* Net */}
                      <td className="px-6 py-4.5 text-sm font-bold text-emerald-600">
                        {formatRupiah(payment.netAmount)}
                      </td>

                      {/* Payment Status */}
                      <td className="px-6 py-4.5">
                        <PaymentStatusBadge status={payment.paymentStatus} />
                      </td>

                      {/* Reconciliation */}
                      <td className="px-6 py-4.5">
                        <ReconciliationBadge status={payment.reconciliationStatus} />
                      </td>

                      {/* Updated At */}
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col text-xs text-gray-500">
                          <span className="font-semibold text-gray-700">{payment.updatedTime}</span>
                          <span className="mt-0.5">{payment.updatedDate}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4.5 text-right relative" onClick={(event) => event.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedPaymentId(payment.id);
                              setIsDetailOpen(true);
                            }}
                            className="bg-[var(--surface-primary)] hover:bg-[var(--surface-secondary)] border border-[var(--border-subtle)] text-xs font-semibold px-2.5 py-1.5 rounded-lg text-[var(--text-secondary)] shadow-[var(--orders-card-shadow)] transition duration-150 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] cursor-pointer"
                          >
                            View
                          </button>

                          <button
                            className="border-0 text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] w-8 h-8 rounded-lg flex items-center justify-center transition duration-150 focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] cursor-pointer"
                            onClick={() => {
                              setSelectedPaymentId(payment.id);
                              setIsDetailOpen(true);
                            }}
                            aria-label={`More actions for ${payment.id}`}
                          >
                            ⋮
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="13" className="text-center py-12 text-gray-400 text-sm font-medium">
                    <strong>No payments found</strong>
                    <span className="block mt-1 text-xs">Try changing the filters or search keyword.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="bg-[var(--surface-primary)] border-x border-b border-[var(--border-subtle)] rounded-b-xl px-6 py-3 flex items-center justify-between shrink-0 select-none text-xs text-[var(--text-muted)] font-semibold mt-[-1px]">
          <div>
            Showing {filteredPayments.length > 0 ? (page - 1) * 10 + 1 : 0} to{" "}
            {Math.min(page * 10, filteredPayments.length)} of{" "}
            {filteredPayments.length} payments
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] flex items-center justify-center hover:bg-[var(--surface-secondary)] transition text-[var(--text-secondary)] disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-[var(--surface-primary)] focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] cursor-pointer"
              >
                ‹
              </button>

              {[1, 2, 3].map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition text-xs font-bold border focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] cursor-pointer ${
                    page === pageNumber
                      ? "bg-[var(--brand-50)] border-[var(--brand-500)] text-[var(--brand-600)]"
                      : "bg-[var(--surface-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
                  }`}
                  onClick={() => setPage(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}

              <span className="px-1 text-[var(--text-subtle)]">…</span>

              <button
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition text-xs font-bold border focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] cursor-pointer ${
                  page === 12
                    ? "bg-[var(--brand-50)] border-[var(--brand-500)] text-[var(--brand-600)]"
                    : "bg-[var(--surface-primary)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
                }`}
                onClick={() => setPage(12)}
              >
                12
              </button>

              <button
                disabled={page === 12}
                onClick={() => setPage((current) => Math.min(12, current + 1))}
                className="w-8 h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] flex items-center justify-center hover:bg-[var(--surface-secondary)] transition text-[var(--text-secondary)] disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-[var(--surface-primary)] focus:outline-none focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)] cursor-pointer"
              >
                ›
              </button>
            </div>

            <select
              defaultValue="10"
              className="bg-[var(--surface-primary)] border border-[var(--border-subtle)] py-1.5 px-3 rounded-lg text-xs font-semibold text-[var(--text-secondary)] cursor-pointer focus:outline-none focus-visible:border-[var(--brand-500)] focus-visible:shadow-[0_0_0_3px_var(--focus-brand-ring)]"
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </select>
          </div>
        </div>
      </div>

      {isDetailOpen && (
        <PaymentDetailDrawer
          payment={currentSelectedPayment}
          onClose={() => setIsDetailOpen(false)}
          onOpenOrder={handleOpenOrder}
          onOpenChat={handleOpenChat}
          onCopyLink={handleCopyLink}
          onRetrySync={handleRetrySync}
        />
      )}
    </div>
  );
}
