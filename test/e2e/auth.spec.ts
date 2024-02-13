import { test, expect } from './fixtures.ts';
import { username } from './consts.ts';
import { ignoreQueryRegExp } from 'test/utils.ts';

test.describe('signup', () => {
  test('signup with existing username', async ({ pageWithUser }) => {
    await pageWithUser.goto('/signup');
    await pageWithUser.getByLabel(/username/i).fill(username);
    await pageWithUser.getByRole('button', { name: /signup with passkey/i }).click();
    await expect(pageWithUser).toHaveURL(ignoreQueryRegExp('/signup'));
    await expect(pageWithUser.getByText(/username already taken/i)).toBeVisible();
  });
});

test.describe('login', () => {
  test('redirect to index if already logged in', async ({ loggedInPage }) => {
    await loggedInPage.goto('/login');
    await expect(loggedInPage).toHaveURL('/');
  });
  test('redirect to landing page if not logged in', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/welcome');
  });
});
