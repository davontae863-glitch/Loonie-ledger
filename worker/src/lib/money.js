// Money helpers. Every amount is integer cents.

/** Parse a decimal or integer amount into integer cents. Payhip sends cents already. */
export function toCents(value) {
  if (value === null || value === undefined || value === '') return 0;
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`Not a number: ${value}`);
  return Math.round(n);
}

export function formatCad(cents) {
  const sign = cents < 0 ? '-' : '';
  const abs = Math.abs(cents);
  return `${sign}$${Math.floor(abs / 100).toLocaleString('en-CA')}.${String(abs % 100).padStart(2, '0')}`;
}

/**
 * Contribution profit for one order:
 * gross - platform fee - processor fee - refunds - production cost.
 * Tax collected on behalf of a government is excluded from revenue.
 */
export function orderContribution(order, productionCostCents = 0) {
  const revenue = order.gross_cents - (order.tax_cents || 0);
  return revenue
    - (order.payhip_fee_cents || 0)
    - (order.processor_fee_cents || 0)
    - (order.refunded_cents || 0)
    - productionCostCents;
}

/**
 * Build a financial summary from real records.
 * Keeps "net proceeds owed to us" separate from "cash actually in the bank".
 */
export function summarize({ orders = [], payouts = [], expenses = [] }) {
  const live = orders.filter((o) => !o.is_test);
  const sum = (arr, f) => arr.reduce((t, x) => t + (f(x) || 0), 0);

  const grossRevenue = sum(live, (o) => o.gross_cents - (o.tax_cents || 0));
  const platformFees = sum(live, (o) => o.payhip_fee_cents);
  const processorFees = sum(live, (o) => o.processor_fee_cents);
  const refunds = sum(live, (o) => o.refunded_cents);
  const productionCosts = sum(live, (o) => o.production_cost_cents || 0);
  const contribution = grossRevenue - platformFees - processorFees - refunds - productionCosts;
  const operatingExpenses = sum(expenses, (e) => e.amount_cents);
  const netOperatingProfit = contribution - operatingExpenses;
  const paidOut = sum(payouts, (p) => p.amount_cents);
  const orderCount = live.length;
  const disputes = live.filter((o) => o.status === 'disputed').length;

  return {
    order_count: orderCount,
    gross_revenue_cents: grossRevenue,
    average_order_value_cents: orderCount ? Math.round(grossRevenue / orderCount) : 0,
    platform_fees_cents: platformFees,
    processor_fees_cents: processorFees,
    refunds_cents: refunds,
    production_costs_cents: productionCosts,
    contribution_profit_cents: contribution,
    operating_expenses_cents: operatingExpenses,
    net_operating_profit_cents: netOperatingProfit,
    // Money the processors owe us minus what has reached the bank.
    pending_payouts_cents: contribution + productionCosts - paidOut,
    // Only this is spendable: payouts that arrived, minus expenses already paid.
    available_cash_cents: paidOut - operatingExpenses,
    disputes,
    test_orders_excluded: orders.length - live.length,
  };
}
