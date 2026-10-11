import { test, expect, loginAsStandardUser } from '../../fixtures/test-fixture';

test.describe('Smoke: Authentication', () => {
  test('standard user can log in and view products', { tag: '@smoke' }, async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginAsStandardUser(loginPage, inventoryPage);
    await expect(inventoryPage.page).toHaveURL(/inventory\.html/);
    const names = await inventoryPage.getProductNames();
    expect(names.length).toBeGreaterThan(0);
  });
});
