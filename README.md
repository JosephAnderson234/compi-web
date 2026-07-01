This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started
Put the c-- compiler binary in the root of the project.

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

## Production

In production (Vercel), the compiler binary is downloaded at runtime from the `COMPILER_BIN_URL` environment variable instead of being read from the project root.
