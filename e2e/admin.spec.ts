import { expect, test } from '@playwright/test';
import { apiLogin, makeAdmin, randomPhone } from './helpers';

test('owner updates today’s price and it is live in the shop immediately', async ({ page }) => {
  const phone = randomPhone();
  await makeAdmin(phone);
  await apiLogin(page.request, phone);

  await page.goto('/admin/catalogue');
  const price = page.getByLabel('Rohu price per kg in rupees');
  const original = await price.inputValue();
  const next = original === '345' ? '340' : '345';
  await price.fill(next);
  await page.getByRole('button', { name: /Save 1 change/ }).click();
  await expect(page.getByText(/Saved 1 product/)).toBeVisible();

  await page.goto('/product/rohu');
  await expect(page.getByRole('paragraph').filter({ hasText: `₹${next}` })).toContainText('/ kg');

  // Restore.
  await page.goto('/admin/catalogue');
  await page.getByLabel('Rohu price per kg in rupees').fill(original);
  await page.getByRole('button', { name: /Save 1 change/ }).click();
  await expect(page.getByText(/Saved 1 product/)).toBeVisible();
});

test('owner processes a cash-on-delivery order end to end', async ({ page, browser }) => {
  // Customer places a COD order through the API.
  const customer = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  await apiLogin(customer.request, randomPhone());
  const { data: pd } = await (await customer.request.get('/api/products/crab')).json();
  await customer.request.put('/api/cart', {
    data: {
      items: [{ productId: pd.product.id, qtyGrams: 1000, cleaningOptionId: pd.cleaningOptions[0].id }],
    },
  });
  const { data: ad } = await (
    await customer.request.post('/api/addresses', {
      data: {
        label: 'Home',
        line1: 'Plot 3, Lane 1',
        city: 'Bhubaneswar',
        state: 'Odisha',
        pincode: '751030',
      },
    })
  ).json();
  const { data: slots } = await (await customer.request.get('/api/slots')).json();
  const slot = slots.asap.available
    ? { type: 'ASAP' }
    : { type: 'SCHEDULED', templateId: slots.scheduled[0].templateId, date: slots.scheduled[0].date };
  const res = await customer.request.post('/api/orders', {
    data: { addressId: ad.address.id, slot, paymentMethod: 'COD' },
  });
  expect(res.status()).toBe(201);
  const { data: order } = await res.json();

  // Owner processes it from the queue.
  const phone = randomPhone();
  await makeAdmin(phone);
  await apiLogin(page.request, phone);
  await page.goto('/admin');
  const card = page.locator('li', { hasText: `#${order.orderNumber}` });
  await card.getByRole('link', { name: 'Details' }).click();
  // First visit compiles the page and its API route in dev.
  await expect(page.getByRole('heading', { name: `Order #${order.orderNumber}` })).toBeVisible({
    timeout: 60_000,
  });
  for (const step of ['cleaning & packing', 'out for delivery', 'delivered']) {
    await page.getByRole('button', { name: `Mark ${step}` }).click();
    // The first status call compiles its API route in dev.
    await expect(page.getByText(new RegExp(`Marked ${step}`, 'i'))).toBeVisible({ timeout: 60_000 });
  }
  await expect(page.getByText('Cash collected')).toBeVisible();

  // The customer sees it delivered.
  const { data: tracked } = await (await customer.request.get(`/api/orders/${order.orderNumber}`)).json();
  expect(tracked.order.status).toBe('DELIVERED');
  await customer.close();
});

test('customers cannot open the admin panel or call admin APIs', async ({ page }) => {
  await apiLogin(page.request, randomPhone());
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/$/);
  expect((await page.request.get('/api/admin/orders')).status()).toBe(403);
});
