const { test, expect } = require('@playwright/test');

test('user can register then login', async ({ page }) => {
  await page.goto('/register');

  // Registration
  const name = page.getByPlaceholder(/enter your name/i).or(page.getByLabel(/name/i)).first();
  const email = page.getByPlaceholder(/enter your email/i).or(page.getByLabel(/email/i)).first();
  const password = page.getByPlaceholder(/enter your password/i).or(page.getByLabel(/password/i)).first();
  const phone = page.getByPlaceholder(/enter your phone/i).or(page.getByLabel(/phone/i)).first();
  const address = page.getByPlaceholder(/enter your address/i).or(page.getByLabel(/address/i)).first();
  const answer = page.getByPlaceholder(/enter your secret answer/i)
    .or(page.getByPlaceholder(/answer/i))
    .or(page.getByLabel(/answer/i))
    .first();

  if (await name.isVisible().catch(() => false)) await name.fill('Alice');
  if (await email.isVisible().catch(() => false)) await email.fill('alice@example.com');
  if (await password.isVisible().catch(() => false)) await password.fill('secret123');
  if (await phone.isVisible().catch(() => false)) await phone.fill('123');
  if (await address.isVisible().catch(() => false)) await address.fill('Street 1');
  if (await answer.isVisible().catch(() => false)) await answer.fill('blue');

  const registerBtn = page.getByRole('button', { name: /register/i }).or(page.getByText(/register/i).first());
  if (await registerBtn.isVisible().catch(() => false)) {
    await registerBtn.click();
  }

  // Expect redirect to login (adjust to your app)
  await expect(page).toHaveURL(/login/i);

  // Login
  const loginEmail = page.getByPlaceholder(/enter your email/i).or(page.getByLabel(/email/i)).first();
  const loginPass = page.getByPlaceholder(/enter your password/i).or(page.getByLabel(/password/i)).first();
  await loginEmail.fill('alice@example.com');
  await loginPass.fill('secret123');

  const loginBtn = page.getByRole('button', { name: /login/i }).or(page.getByText(/login/i).first());
  await loginBtn.click();

  // Expect landing page/dashboard
  await expect(page).toHaveURL(/dashboard/i);
});
