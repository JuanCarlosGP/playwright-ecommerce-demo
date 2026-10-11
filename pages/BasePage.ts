import { type Page, type Locator } from '@playwright/test';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async goto(path = '/') {
    await this.page.goto(path);
  }
}
