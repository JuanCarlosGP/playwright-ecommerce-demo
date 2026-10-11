import { test, expect, loginAsStandardUser } from '../../fixtures/test-fixture';

test.describe('Regression: Shopping flow', () => {
  test.beforeEach(async ({ loginPage, inventoryPage }) => {
    await loginAsStandardUser(loginPage, inventoryPage);
  });

  test('add item to cart and complete checkout', { tag: '@regression' }, async ({
    inventoryPage,
    cartPage,
    checkoutStepOne,
    checkoutStepTwo,
    checkoutComplete,
  }) => {
    const product = 'Sauce Labs Backpack';

    await inventoryPage.addItemToCart(product);
    await inventoryPage.openCart();
    await cartPage.expectLoaded();
    await cartPage.expectItemInCart(product);
    await cartPage.proceedToCheckout();

    await checkoutStepOne.fillInformation({
      firstName: 'Test',
      lastName: 'User',
      postalCode: '12345',
    });

    await checkoutStepTwo.expectOverviewVisible();
    await checkoutStepTwo.finishOrder();
    await checkoutComplete.expectOrderComplete();
  });

  test('user can log out and return to login', { tag: '@regression' }, async ({
    inventoryPage,
    loginPage,
  }) => {
    await inventoryPage.logout();
    await expect(loginPage.loginButton).toBeVisible();
    await expect(inventoryPage.page).toHaveURL(/\/$/);
  });
});
