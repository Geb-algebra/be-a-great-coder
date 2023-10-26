import { test, expect } from './fixtures.ts';
import { username, password } from './consts.ts';
import { ignoreQueryRegExp } from 'test/utils.ts';

test.describe('signup', () => {
  test('signup with password', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel(/username/i).fill(username);
    await page.getByRole('button', { name: /next/i }).click();
    await page.waitForURL(ignoreQueryRegExp('/signup/pass'));
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole('button', { name: /sign up with password/i }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/hello/i)).toBeVisible();
  });
  test('signup with existing username', async ({ pageWithUser }) => {
    await pageWithUser.goto('/signup');
    await pageWithUser.getByLabel(/username/i).fill(username);
    await pageWithUser.getByRole('button', { name: /next/i }).click();
    await expect(pageWithUser).toHaveURL(ignoreQueryRegExp('/signup'));
    await expect(pageWithUser.getByText(/username already taken/i)).toBeVisible();
  });
});

test.describe('login', () => {
  test('login', async ({ pageWithUser }) => {
    await pageWithUser.goto('/login');
    await pageWithUser.getByRole('button', { name: /log in with password/i }).click();
    await pageWithUser.waitForURL('/login/password');
    await pageWithUser.getByLabel(/username/i).fill(username);
    await pageWithUser.getByLabel(/password/i).fill(password);
    await pageWithUser.getByRole('button', { name: /log in/i }).click();
    await expect(pageWithUser).toHaveURL('/');
    await expect(pageWithUser.getByText(/hello/i)).toBeVisible();
  });
  test('login with wrong password', async ({ pageWithUser }) => {
    await pageWithUser.goto('/login/password');
    await pageWithUser.getByLabel(/username/i).fill(username);
    await pageWithUser.getByLabel(/password/i).fill('wrong password');
    await pageWithUser.getByRole('button', { name: /log in/i }).click();
    await expect(pageWithUser).toHaveURL('/login/password');
    await expect(pageWithUser.getByText(/invalid password/i)).toBeVisible();
  });
  test('login with wrong username', async ({ pageWithUser }) => {
    await pageWithUser.goto('/login/password');
    await pageWithUser.getByLabel(/username/i).fill('wrong username');
    await pageWithUser.getByLabel(/password/i).fill(password);
    await pageWithUser.getByRole('button', { name: /log in/i }).click();
    await expect(pageWithUser).toHaveURL('/login/password');
    await expect(pageWithUser.getByText(/user not found/i)).toBeVisible();
  });
  test('redirect to index if already logged in', async ({ loggedInPage }) => {
    await loggedInPage.goto('/login');
    await expect(loggedInPage).toHaveURL('/');
  });
  test('redirect to landing page if not logged in', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/welcome');
  });
});
