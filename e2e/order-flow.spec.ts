import { expect, test } from '@playwright/test';
import { completeLoginForm, randomPhone } from './helpers';

test('guest adds to cart, logs in at checkout and pays online via the webhook', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Fresh Seafood/ })).toBeVisible();

  await page.getByRole('link', { name: 'Shop now' }).click();
  await page.getByRole('link', { name: /Pomfret/ }).click();
  await expect(page.getByRole('heading', { name: 'Pomfret', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Increase quantity' }).click();
  await page.getByText('Curry cut').click();
  await page.getByRole('button', { name: /Add to cart · ₹975/ }).click();

  await expect(page).toHaveURL(/\/cart/);
  await expect(page.getByText('₹650/kg · Curry cut')).toBeVisible();
  await expect(page.getByText('₹1,015')).toBeVisible(); // server quote incl. ₹40 delivery
  await page.getByRole('button', { name: 'Proceed to checkout' }).click();

  // Login sheet, then straight on to checkout with the cart intact.
  await completeLoginForm(page, randomPhone());
  await expect(page).toHaveURL(/\/checkout/);

  await page
    .getByRole('button', { name: /Add new address/ })
    .first()
    .click();
  await page.getByLabel('House / flat, street').fill('Plot 12, Lane 4');
  await page.getByLabel('Pincode').fill('751030');
  await expect(page.getByText(/we deliver to/i)).toBeVisible();
  await page.getByRole('button', { name: 'Save address' }).click();
  await expect(page.getByText('Plot 12, Lane 4').first()).toBeVisible();

  await page.getByRole('button', { name: 'Continue to payment' }).click();
  await expect(page).toHaveURL(/\/payment/);
  await page.getByRole('button', { name: /^Pay ₹1,015/ }).click();

  // Dev "fake" gateway sends a signed webhook through the real handler.
  await expect(page).toHaveURL(/\/pay\/FP\d+/);
  await page.getByRole('button', { name: 'Pay successfully' }).click();
  await expect(page.getByRole('heading', { name: 'Order confirmed!' })).toBeVisible();

  await page.getByRole('link', { name: 'Track order' }).click();
  await expect(page.getByText('Cleaning & packing')).toBeVisible();
  await expect(page.getByText('Total paid')).toBeVisible();

  // Customer can cancel before cleaning starts; the paid order becomes a refund.
  await page.getByRole('button', { name: 'Cancel order', exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel order', exact: true }).click();
  await expect(page.getByText('Refund in progress')).toBeVisible();
});

test('shop filter sheet narrows the list on the server', async ({ page }) => {
  await page.goto('/shop');
  await page.getByRole('button', { name: 'Open filters' }).click();
  const sheet = page.getByRole('dialog', { name: 'Filters' });
  await sheet.getByText('Above ₹600').click();
  await expect(page).toHaveURL(/priceBand=b2/);
  await sheet.getByRole('button', { name: /Show \d+ items/ }).click();
  await expect(page.getByRole('button', { name: 'Open filters, 1 active' })).toBeVisible();
  for (const price of await page
    .locator('main ul li')
    .getByText(/₹\d[\d,]*\/kg/)
    .allTextContents()) {
    expect(Number(price.replace(/[^\d]/g, ''))).toBeGreaterThan(600);
  }
});

test('protected pages send guests to login and come back', async ({ page }) => {
  await page.goto('/orders');
  await expect(page).toHaveURL(/\/login\?next=%2Forders/);
  await completeLoginForm(page, randomPhone());
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.getByRole('heading', { name: 'My orders' })).toBeVisible();
});
