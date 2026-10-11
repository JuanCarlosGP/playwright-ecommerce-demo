import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import {
  CheckoutStepOnePage,
  CheckoutStepTwoPage,
  CheckoutCompletePage,
} from '../pages/CheckoutPage';
import { config } from '../config/env';

type PageObjects = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutStepOne: CheckoutStepOnePage;
  checkoutStepTwo: CheckoutStepTwoPage;
  checkoutComplete: CheckoutCompletePage;
};

export const test = base.extend<PageObjects>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  inventoryPage: async ({ page }, use) => {
    await use(new InventoryPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  checkoutStepOne: async ({ page }, use) => {
    await use(new CheckoutStepOnePage(page));
  },
  checkoutStepTwo: async ({ page }, use) => {
    await use(new CheckoutStepTwoPage(page));
  },
  checkoutComplete: async ({ page }, use) => {
    await use(new CheckoutCompletePage(page));
  },
});

export { expect } from '@playwright/test';

export async function loginAsStandardUser(loginPage: LoginPage, inventoryPage: InventoryPage) {
  await loginPage.open();
  await loginPage.login(config.users.standard.username, config.users.standard.password);
  await inventoryPage.expectLoaded();
}
