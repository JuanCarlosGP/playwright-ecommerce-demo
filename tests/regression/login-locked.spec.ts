import { test, expect } from '../../fixtures/test-fixture';
import { config } from '../../config/env';

test.describe('Regression: Locked user', () => {
  test('locked out user sees error message', { tag: '@regression' }, async ({ loginPage }) => {
    await loginPage.open();
    await loginPage.login(config.users.locked.username, config.users.locked.password);

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText(
      'Sorry, this user has been locked out.',
    );
  });
});
