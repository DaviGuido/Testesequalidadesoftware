const { Builder, By, until } = require('selenium-webdriver');
const { assert } = require('chai');
const fs = require('node:fs');
const path = require('node:path');

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5173';
const API_BASE_URL = process.env.E2E_API_BASE_URL || 'http://localhost:4001';
const TEST_PASSWORD = 'P2-Selenium-Test-2026!';
const FAILURE_DIR = path.join(process.cwd(), 'test-results', 'e2e');

let driver;

async function createAccountAndLogin() {
  const email = `p2.selenium.${Date.now()}@example.test`;

  await driver.get(`${BASE_URL}/register`);
  await driver.wait(until.elementLocated(By.id('email')), 10000);

  await driver.findElement(By.id('email')).sendKeys(email);
  await driver.findElement(By.id('password')).sendKeys(TEST_PASSWORD);
  await driver.findElement(By.id('verifyPassword')).sendKeys(TEST_PASSWORD);
  await driver.findElement(By.css('form button[type="submit"]')).click();

  await driver.wait(until.urlContains('/login'), 10000);
  await driver.wait(until.elementLocated(By.id('email')), 5000);

  await driver.findElement(By.id('email')).sendKeys(email);
  await driver.findElement(By.id('password')).sendKeys(TEST_PASSWORD);
  await driver.findElement(By.css('form button[type="submit"]')).click();

  await driver.wait(until.urlContains('/products'), 10000);
  await driver.wait(until.elementLocated(By.css('.auth-status')), 5000);

  return email;
}

async function getProducts() {
  const response = await fetch(`${API_BASE_URL}/products`);

  if (!response.ok) {
    throw new Error(`Could not load product fixtures: HTTP ${response.status}`);
  }

  const data = await response.json();
  const products = data.products || [];

  if (products.length === 0) {
    throw new Error('No products are available. Add a fictitious product before running Selenium tests.');
  }

  return products;
}

async function getProductWithStockForQuantityUpdate() {
  const products = await getProducts();
  const product = products.find((item) => {
    const stock = Number(item.inventory_quantity ?? item.inventoryQuantity ?? 0);
    return stock >= 2;
  });

  if (!product) {
    throw new Error('No product has inventory of at least 2. Prepare a fictitious product with stock before running UI-03/UI-04.');
  }

  return product;
}

async function addProductFromCatalog(productName) {
  await driver.get(`${BASE_URL}/products`);
  await driver.wait(until.elementLocated(By.css('.product-card')), 10000);

  const cards = await driver.findElements(By.css('.product-card'));
  let selectedCard = null;

  for (const card of cards) {
    const heading = await card.findElement(By.css('.product-title-link h2')).getText();

    if (heading.trim() === productName) {
      selectedCard = card;
      break;
    }
  }

  if (!selectedCard) {
    throw new Error(`Product "${productName}" was not found in the storefront.`);
  }

  await selectedCard.findElement(By.css('button.product-card-cart-button')).click();

  await driver.wait(async () => {
    const messages = await selectedCard.findElements(By.css('.inline-message'));
    if (messages.length === 0) return false;
    return (await messages[0].getText()).length > 0;
  }, 10000);
}

async function openCartThroughNavigation() {
  const cartLink = await driver.wait(
    until.elementLocated(By.css('.site-nav a[href="/cart"]')),
    10000
  );
  await cartLink.click();
  await driver.wait(until.elementLocated(By.css('.cart-page-shell')), 10000);
}

describe('P08 - Selenium E2E (interface real)', function () {
  this.timeout(45000);

  beforeEach(async function () {
    driver = await new Builder().forBrowser('chrome').build();
    await driver.manage().setTimeouts({ implicit: 0, pageLoad: 20000, script: 10000 });
  });

  afterEach(async function () {
    if (this.currentTest && this.currentTest.state === 'failed' && driver) {
      try {
        fs.mkdirSync(FAILURE_DIR, { recursive: true });
        const safeName = this.currentTest.title.replace(/[^a-z0-9-_]+/gi, '_');
        const screenshot = await driver.takeScreenshot();
        fs.writeFileSync(path.join(FAILURE_DIR, `${safeName}.png`), screenshot, 'base64');
      } catch (captureError) {
        process.stderr.write(`Could not save failure screenshot: ${captureError.message}\n`);
      }
    }

    if (driver) {
      await driver.quit();
      driver = null;
    }
  });

  it('UI-01 - registra uma conta e realiza login pela interface', async function () {
    const email = await createAccountAndLogin();

    const authStatus = await driver.findElement(By.css('.auth-status')).getText();
    assert.include(authStatus, email);
    assert.include(await driver.getCurrentUrl(), '/products');
  });

  it('UI-02 - navega pelo catálogo e abre os detalhes de um produto', async function () {
    const products = await getProducts();
    const expectedName = products[0].name;

    await driver.get(`${BASE_URL}/products`);
    await driver.wait(until.elementLocated(By.css('.product-card')), 10000);

    const cards = await driver.findElements(By.css('.product-card'));
    let selectedLink = null;

    for (const card of cards) {
      const heading = await card.findElement(By.css('.product-title-link h2')).getText();

      if (heading.trim() === expectedName) {
        selectedLink = await card.findElement(By.css('a.product-title-link'));
        break;
      }
    }

    assert.isNotNull(selectedLink, 'Expected product should be visible in the catalog');
    await selectedLink.click();

    await driver.wait(until.elementLocated(By.css('.product-detail-copy h1')), 10000);
    const detailName = await driver.findElement(By.css('.product-detail-copy h1')).getText();
    assert.equal(detailName, expectedName);
  });

  it('UI-03 - adiciona produto ao carrinho e atualiza a quantidade', async function () {
    await createAccountAndLogin();

    const product = await getProductWithStockForQuantityUpdate();
    await addProductFromCatalog(product.name);
    await openCartThroughNavigation();

    await driver.wait(until.elementLocated(By.css('article.cart-item')), 10000);

    const findCartItem = async () => {
      const items = await driver.findElements(By.css('article.cart-item'));

      for (const item of items) {
        const text = await item.getText();
        if (text.includes(product.name)) return item;
      }

      return null;
    };

    const item = await findCartItem();
    assert.isNotNull(item, 'The selected product should be present in the cart');

    const controls = await item.findElement(By.css('.quantity-controls'));
    const buttons = await controls.findElements(By.css('button'));
    assert.lengthOf(buttons, 2, 'Quantity controls should have decrement and increment buttons');
    await buttons[1].click();

    await driver.wait(async () => {
      const refreshedItem = await findCartItem();
      if (!refreshedItem) return false;
      const refreshedControls = await refreshedItem.findElement(By.css('.quantity-controls'));
      return (await refreshedControls.getText()).includes('Qty 2');
    }, 10000);

    const updatedItem = await findCartItem();
    const updatedControls = await updatedItem.findElement(By.css('.quantity-controls'));
    assert.include(await updatedControls.getText(), 'Qty 2');
  });

  it('UI-04 - apresenta mensagem adequada quando o Stripe de teste não está configurado', async function () {
    await createAccountAndLogin();

    const product = await getProductWithStockForQuantityUpdate();
    await addProductFromCatalog(product.name);
    await openCartThroughNavigation();

    const checkoutLink = await driver.wait(
      until.elementLocated(By.css('a[href="/checkout"]')),
      10000
    );
    await checkoutLink.click();

    await driver.wait(until.elementLocated(By.css('.checkout-card button.primary-button')), 10000);
    await driver.findElement(By.css('.checkout-card button.primary-button')).click();

    const error = await driver.wait(
      until.elementLocated(By.css('.checkout-card .form-message.error-message')),
      15000
    );

    const message = await error.getText();
    assert.include(message, 'Stripe is not configured');
    assert.include(await driver.getCurrentUrl(), '/checkout');
  });
});
