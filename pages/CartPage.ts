import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  readonly title: Locator;
  readonly cartList: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.locator('.title');
    this.cartList = page.locator('.cart_list');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  async expectLoaded() {
    await expect(this.title).toHaveText('Your Cart');
    await expect(this.cartList).toBeVisible();
  }

  cartItem(name: string): Locator {
    return this.page.locator('.cart_item').filter({ hasText: name });
  }

  async expectItemInCart(productName: string) {
    await expect(this.cartItem(productName)).toBeVisible();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }
}
