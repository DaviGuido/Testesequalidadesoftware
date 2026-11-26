/**
 * Pure helpers used by the Stripe checkout route.
 * Keeping these functions independent from Express, PostgreSQL and Stripe
 * allows them to be tested as unit tests.
 */
function getClientOrigin(env = process.env) {
  return env.CLIENT_ORIGIN || 'http://localhost:5173';
}

function getCurrency(env = process.env) {
  return env.STRIPE_CURRENCY || 'usd';
}

function toStripeUnitAmount(price) {
  return Math.round(Number(price) * 100);
}

function isValidUserId(userId) {
  return Number.isInteger(Number(userId));
}

function createStripeLineItem(item, currency) {
  const unitAmount = toStripeUnitAmount(item.price);
  const quantity = Number(item.quantity);

  if (!Number.isInteger(unitAmount) || unitAmount <= 0) {
    return null;
  }

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return null;
  }

  return {
    price_data: {
      currency: currency,
      product_data: {
        name: item.name,
        description: item.description || undefined
      },
      unit_amount: unitAmount
    },
    quantity
  };
}

function createStripeLineItems(items, currency) {
  return items.map((item) => createStripeLineItem(item, currency));
}

module.exports = {
  getClientOrigin,
  getCurrency,
  toStripeUnitAmount,
  isValidUserId,
  createStripeLineItem,
  createStripeLineItems
};
