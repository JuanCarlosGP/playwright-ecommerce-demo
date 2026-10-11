import { type Page, type Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutStepOnePage extends BasePage {
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    super(page);
    this.firstName = page.locator('[data-test="firstName"]');
    this.lastName = page.locator('[data-test="lastName"]');
    this.postalCode = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
  }

  async fillInformation(info: { firstName: string; lastName: string; postalCode: string }) {
    await this.firstName.fill(info.firstName);
    await this.lastName.fill(info.lastName);
    await this.postalCode.fill(info.postalCode);
    await this.continueButton.click();
  }
}

export class CheckoutStepTwoPage extends BasePage {
  readonly finishButton: Locator;
  readonly summaryInfo: Locator;

  constructor(page: Page) {
    super(page);
    this.finishButton = page.locator('[data-test="finish"]');
    this.summaryInfo = page.locator('.summary_info');
  }

  async expectOverviewVisible() {
    await expect(this.summaryInfo).toBeVisible();
  }

  async finishOrder() {
    await this.finishButton.click();
  }
}

export class CheckoutCompletePage extends BasePage {
  readonly completeHeader: Locator;
  readonly completeText: Locator;

  constructor(page: Page) {
    super(page);
    this.completeHeader = page.locator('.complete-header');
    this.completeText = page.locator('.complete-text');
  }

  async expectOrderComplete() {
    await expect(this.completeHeader).toHaveText('Thank you for your order!');
    await expect(this.completeText).toContainText('Your order has been dispatched');
  }
}
