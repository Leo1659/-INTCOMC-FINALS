This is a Next.js + Tailwind project for a mobile-first Philippine Law AI Assistant.

## Getting Started

Environment

Create `.env.local` in `web/` with:

```
OPENAI_API_KEY=sk-...
```

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

The chat UI is in `src/app/page.tsx`. The API route is `src/app/api/chat/route.ts`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

Notes and disclaimers

- Educational information only; not a substitute for legal advice or representation.
- Laws and procedures may vary by LGU/agency and change over time; verify with official sources.
