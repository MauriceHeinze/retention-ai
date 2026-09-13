# RetentionAI

**Turn shipped features into a reason for former customers to return.**

Customers cancel because a feature is missing. When it finally ships, RetentionAI connects the release to their cancellation feedback, drafts a personal email, and lets your team approve delivery.

**Distinctive approach:** RetentionAI connects release evidence to each customer's specific cancellation reason, including cases where a related feature does not solve their need.

**[Try the demo](https://frontend-production-7c37.up.railway.app)** | **[Watch the demo video](https://www.dropbox.com/scl/fo/jgcqrm2kspsdvlcuoohs6/ABe4eFmCPvv0VRyGm4i7UfA?rlkey=n8f3peoqplwmwsjyp0qyowl6y&st=t01ega6o&dl=0)**

## Try it in 60 seconds

1. Open the demo and select **Open demo**. No setup or API keys needed.
2. Open a campaign to review customer feedback, release evidence, and email drafts.
3. Compare manual CSV export with scheduled CSV emails: the release solves only the first need.

**Run sample analysis** runs the model on built-in fixtures, with cached results when available. **Confirm send** delivers a real email only to the team's fixed test inbox.

## How it works

```text
GitHub deployment -> Stripe cancellation feedback -> AI assessment
  -> Human approval -> Resend email
```

- **GitHub:** verify a signed deployment event and read the feature diff.
- **Stripe:** find eligible former customers and read why they canceled.
- **Agent:** use the Vercel AI SDK and OpenRouter to read both sources, return `match`, `no_match`, or `needs_review`, and draft emails with source evidence.
- **Resend:** send only after approval, with duplicate-send protection.

Deployment jobs and completed assessments persist across backend restarts. Invalid evidence or model output stops the flow before sending.

## Reliability

**34 backend tests passed**, covering webhook validation, contact eligibility, evidence checks, duplicate events, restart recovery, and email approval rules.

Our five-scenario model smoke check expects: manual export **matches**; scheduled export and price concerns **do not**; missing feedback **needs review**; an ineligible contact is **excluded**. The live GitHub -> Stripe -> Resend flow was tested, and the recipient confirmed email delivery. Frontend build and browser checks also passed.

From `backend/`, run `npm ci`, then `npm test` and `npm run typecheck`. Run `npm run agent:smoke` with an OpenRouter key to reproduce the model check. This is a small functional evaluation, not a measured accuracy benchmark.

## Run locally

With Node.js 24 and Git:

```bash
git clone https://github.com/MauriceHeinze/retention-ai.git
cd retention-ai/frontend
npx pnpm@11.20.0 install --frozen-lockfile
npm run dev
```

Open [localhost:5173](http://localhost:5173). It connects to the hosted backend without local secrets.

For a local backend: run `npm ci` in `backend/`, copy `.env.example` to `.env.local`, add `OPENROUTER_API_KEY`, and run `npm start`. Set `VITE_BACKEND_URL=http://localhost:3002` in `frontend/.env.local` and restart the frontend. This supports sample analysis; keep provider keys out of Git and frontend variables.

## Demo scope

GitHub, Stripe sandbox, model calls, and Resend delivery are real. The [test repository](https://github.com/ilindaniel/retention-ai-testing) **simulates deployment**, and Stripe contains **five fictional customers**. The sample button uses fixtures instead of GitHub and Stripe.

Release extraction is limited to the test repository's `features/` files. Login and settings are prototypes. Sample runs and email delivery status reset on restart; model failures may require retrying. This is not yet a production service for real customer data.

## Built during the hackathon

We built the integration flow, agent tools and validation, approval dashboard, persistence, hosting setup, and tests. We reused React, Vite, Tailwind/shadcn, SWR, Vercel AI SDK, OpenRouter, Stripe SDK, Zod, and Railway.

[Noncommercial license](LICENSE) with [permission for hackathon judging](NOTICE).
