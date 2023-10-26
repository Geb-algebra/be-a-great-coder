# My Remix Stack

minimum remix setup just for me.

- Typescript
- [Prisma](https://www.prisma.io/docs) for ORM
- [remix-auth](https://github.com/sergiodxa/remix-auth) for Auth
- Linter and formatter with my favorite configurations.
- [Vitest](https://vitest.dev/guide/) for unit testing (not support component testing)
- [Playwright](https://playwright.dev/) for e2e testing
- [Fly.io](https://fly.io/docs/) for deployment

## Initial setup needed before developing apps

### 1. Check the cloned stack works right

1. run `docker compose run --rm --service-ports remix`, `npm run dev` and confirm you can access the app at `http://localhost:3000`
2. stop the container and run `docker compose run validate`. Confirm that all of lint, typecheck, vitest and cypress runs and succeeded.
