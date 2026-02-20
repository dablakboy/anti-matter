/**
 * Stripe payment links for Support Anti-Matter donations.
 */
export const SUPPORT_AMOUNTS_ROW1 = [1, 5, 10] as const;
export const SUPPORT_AMOUNTS_ROW2 = [20, 50, 100] as const;

/** $10/month unlimited developer uploads */
export const DEVELOPER_SUBSCRIPTION_LINK = 'https://buy.stripe.com/dRmfZgbzydlq0cv24e3AY0e';

export const STRIPE_PAYMENT_LINKS: Record<number, string> = {
  1: 'https://buy.stripe.com/eVq6oG5ba5SY1gzaAK3AY08',
  5: 'https://buy.stripe.com/6oU7sKdHG2GMaR95gq3AY09',
  10: 'https://buy.stripe.com/bJe14m1YYchm7EX4cm3AY0a',
  20: 'https://buy.stripe.com/eVq14m0UUa9e0cvgZ83AY0b',
  50: 'https://buy.stripe.com/bJefZg4764OUgbt24e3AY0c',
  100: 'https://buy.stripe.com/5kQbJ09rq95acZh9wG3AY0d',
};
