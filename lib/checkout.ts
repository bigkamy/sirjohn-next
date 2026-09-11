// Keep in sync with orders_payment_method_check and place_order in supabase/migrations.
export const PAYMENT_METHODS = ["upi", "card", "netbanking", "wallet"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  upi: "UPI",
  card: "Credit / Debit Card",
  netbanking: "Net Banking",
  wallet: "Wallets",
};
