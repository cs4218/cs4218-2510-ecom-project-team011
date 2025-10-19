import { 
  testUser,
  testAsSomeone, 
  testAsUser, 
  testAsLoggedOut, 
  expect
} from './testutils.js';

testAsUser.describe('Dashboard access flow (authenticated user)', () => {
  testAsUser('shows user details when navigating to dashboard', async ({ page }) => {
    await page.goto('/');
    
    await page.getByRole('button', { name: testUser.name, exact: true }).click();
    await page.getByRole('link', { name: 'Dashboard' }).click();    
    
    // Expect user info is visible
    await expect(page.getByRole('heading', { name: testUser.name })).toBeVisible();
    await expect(page.getByText(testUser.address)).toBeVisible();
    await expect(page.getByText(testUser.email)).toBeVisible();
    
  });
});

testAsLoggedOut.describe('Dashboard access flow (unauthenticated user)', () => {
  testAsLoggedOut('redirects to "/" if visiting dashboard directly', async ({ page }) => {
    await page.goto('/dashboard/user/');
    await expect(page).toHaveURL('/'); // redirected back home
  });
});


testAsUser.describe('Profile editing (authenticated user)', () => {
  
  const getInputs = (page) => {
    const nameInput = page.getByPlaceholder("Enter Your Name");
    const emailInput = page.getByPlaceholder("Enter Your Email");
    const passwordInput = page.getByPlaceholder("Enter Your Password");
    const addressInput = page.getByPlaceholder("Enter Your Address");
    const phoneInput = page.getByPlaceholder("Enter Your Phone");
    
    return { nameInput, emailInput, passwordInput, addressInput, phoneInput }
  }
  
  testAsUser('shows user details in profile form', async ({ page }) => {
    await page.goto('/dashboard/user/');
    await page.getByRole('link', { name: 'Profile' }).click();;
    
    const { nameInput, emailInput, addressInput, phoneInput, passwordInput } = getInputs(page)
    
    // Expect prefilled form values
    await expect(nameInput).toHaveValue(testUser.name);
    await expect(emailInput).toHaveValue(testUser.email);
    await expect(passwordInput).toHaveValue("");
    await expect(addressInput).toHaveValue(testUser.address);
    await expect(phoneInput).toHaveValue(testUser.phone);
  });
  
  testAsUser('shows validation error for short password', async ({ page }) => {
    await page.goto('/dashboard/user/');
    await page.getByRole('link', { name: 'Profile' }).click();;
    
    const {passwordInput} = getInputs(page);
    
    // Clear + enter values
    await passwordInput.fill('123'); // too short
    
    await page.getByRole('button', { name: 'UPDATE' }).click();
    
    // Expect validation error (adjust selector based on your UI)
    await expect(page.getByText(/6/)).toBeVisible();
  });


  
});

/*
testAsUser.describe('Orders page (authenticated user)', () => {
  testAsUser('shows list of user orders', async ({ page }) => {
    await page.goto('/dashboard/user/');
    await page.click('text=Orders');
    
    const ordersTable = page.locator('[data-testid="orders-table"]');
    await expect(ordersTable).toBeVisible();
    
    // Expect at least one order row (adjust selector as needed)
    await expect(ordersTable.locator('tr')).toHaveCountGreaterThan(0);
  });
});
*/
