import { expect, test } from '@playwright/test';

test('customer can order from home to tracking with mock data', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Fresh Seafood/ })).toBeVisible();

  await page.getByRole('link', { name: 'Shop now' }).click();
  await expect(page).toHaveURL(/\/shop/);
  await page.getByRole('link', { name: /Pomfret/ }).click();

  await expect(page.getByRole('heading', { name: 'Pomfret', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Increase quantity' }).click();
  await page.getByText('Curry cut').click();
  await page.getByRole('button', { name: /Add to cart · ₹975/ }).click();

  await expect(page).toHaveURL(/\/cart/);
  await expect(page.getByText('₹650/kg · Curry cut')).toBeVisible();
  await page.getByRole('link', { name: 'Proceed to checkout' }).click();

  await expect(page.getByRole('heading', { name: 'Checkout' })).toBeVisible();
  await page.getByRole('button', { name: 'Continue to payment' }).click();

  await page.getByText('Cash on delivery').click();
  await page.getByRole('button', { name: /Place order · ₹1,015/ }).click();

  await expect(page.getByRole('heading', { name: 'Order confirmed!' })).toBeVisible();
  await page.getByRole('link', { name: 'Track order' }).click();
  await expect(page.getByText('Cleaning & packing')).toBeVisible();

  await page.getByRole('link', { name: 'Back to my orders' }).click();
  await expect(page.getByRole('link', { name: /#FP1024/ })).toBeVisible();
});

test('shop filter sheet narrows the list', async ({ page }) => {
  await page.goto('/shop');
  await page.getByRole('button', { name: 'Open filters' }).click();
  const sheet = page.getByRole('dialog', { name: 'Filters' });
  await sheet.getByText('Above ₹600').click();
  await sheet.getByRole('button', { name: 'Show 3 items' }).click();
  await expect(page.getByRole('button', { name: 'Open filters, 1 active' })).toBeVisible();
  await expect(page.locator('main ul > li')).toHaveCount(3);
});
