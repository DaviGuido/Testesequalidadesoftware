const { assert } = require('chai');
const {
  getClientOrigin,
  getCurrency,
  toStripeUnitAmount,
  isValidUserId,
  createStripeLineItem,
  createStripeLineItems
} = require('../../utils/checkoutUtils');

describe('Checkout utility unit tests', () => {
  it('uses the local frontend origin when CLIENT_ORIGIN is not configured', () => {
    assert.equal(getClientOrigin({}), 'http://localhost:5173');
  });

  it('uses the configured frontend origin', () => {
    assert.equal(
      getClientOrigin({ CLIENT_ORIGIN: 'https://store.example.test' }),
      'https://store.example.test'
    );
  });

  it('uses USD when STRIPE_CURRENCY is not configured', () => {
    assert.equal(getCurrency({}), 'usd');
  });

  it('uses the configured Stripe currency', () => {
    assert.equal(getCurrency({ STRIPE_CURRENCY: 'brl' }), 'brl');
  });

  it('converts a decimal price into the integer amount expected by Stripe', () => {
    assert.equal(toStripeUnitAmount('19.99'), 1999);
  });

  it('accepts an integer user ID represented as a string', () => {
    assert.isTrue(isValidUserId('42'));
  });

  it('rejects a non-integer user ID', () => {
    assert.isFalse(isValidUserId('4.2'));
  });

  it('creates a Stripe line item with the price in cents and numeric quantity', () => {
    const result = createStripeLineItem({
      name: 'Notebook',
      description: 'Hardcover notebook',
      price: '12.50',
      quantity: '2'
    }, 'brl');

    assert.deepEqual(result, {
      price_data: {
        currency: 'brl',
        product_data: {
          name: 'Notebook',
          description: 'Hardcover notebook'
        },
        unit_amount: 1250
      },
      quantity: 2
    });
  });

  it('rejects a line item with an invalid or non-positive price', () => {
    assert.isNull(createStripeLineItem({
      name: 'Invalid product',
      price: 'not-a-price',
      quantity: 1
    }, 'usd'));

    assert.isNull(createStripeLineItem({
      name: 'Free product',
      price: '0',
      quantity: 1
    }, 'usd'));
  });

      it('rejects a line item with a quantity that is not a positive integer', () => {
    const invalidQuantities = [0, -1, 1.5, 'invalid', null, undefined];

    invalidQuantities.forEach((quantity) => {
      assert.isNull(createStripeLineItem({
        name: 'Notebook',
        price: '12.50',
        quantity: quantity
      }, 'usd'));
    });
  });

  it('maps every cart product into a Stripe line item', () => {
    const result = createStripeLineItems([
      { name: 'Pen', description: 'Blue pen', price: 2.5, quantity: 3 },
      { name: 'Notebook', description: '', price: 5, quantity: 1 }
    ], 'usd');

    assert.lengthOf(result, 2);
    assert.equal(result[0].price_data.unit_amount, 250);
    assert.equal(result[0].quantity, 3);
    assert.equal(result[1].price_data.unit_amount, 500);
    assert.equal(result[1].quantity, 1);
    assert.isUndefined(result[1].price_data.product_data.description);
  });
});
